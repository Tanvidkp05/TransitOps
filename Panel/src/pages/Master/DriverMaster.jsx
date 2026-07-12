import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Form,
  Input,
  Label,
  Row,
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";
import { toast } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import FormsFooter from "../../Components/Common/FormAddFooter";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import {
  createDriver,
  deleteDriver,
  getDriverById,
  searchDrivers,
  updateDriver,
} from "../../api/drivers.api";

const statusOptions = [
  { value: "Available", label: "Available" },
  { value: "On Trip", label: "On Trip" },
  { value: "Off Duty", label: "Off Duty" },
  { value: "Suspended", label: "Suspended" },
];

const initialState = {
  name: "",
  licenseNumber: "",
  licenseCategory: "",
  licenseExpiryDate: "",
  contactNumber: "",
  safetyScore: "",
  status: "Available",
};

const DriverMaster = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);

  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [pageNo, setPageNo] = useState(1);
  const [column, setColumn] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [query, setQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  const statusValue = useMemo(() => {
    return statusOptions.find((item) => item.value === values.status) || null;
  }, [values.status]);

  const validate = (currentValues) => {
    const errors = {};

    if (!currentValues.name.trim()) errors.name = "Name is required";
    if (!currentValues.licenseNumber.trim()) errors.licenseNumber = "License Number is required";
    if (!currentValues.licenseCategory.trim()) errors.licenseCategory = "License Category is required";
    if (!currentValues.licenseExpiryDate) errors.licenseExpiryDate = "License Expiry Date is required";
    if (!currentValues.contactNumber.trim()) errors.contactNumber = "Contact Number is required";
    if (currentValues.safetyScore === "" || currentValues.safetyScore === null || currentValues.safetyScore === undefined) {
      errors.safetyScore = "Safety Score is required";
    } else if (Number.isNaN(Number(currentValues.safetyScore)) || Number(currentValues.safetyScore) < 0 || Number(currentValues.safetyScore) > 100) {
      errors.safetyScore = "Safety Score must be between 0 and 100";
    }

    if (!currentValues.status) errors.status = "Status is required";

    return errors;
  };

  const resetForm = () => {
    setValues(initialState);
    setSelectedStatus(null);
    setFormErrors({});
    setIsSubmit(false);
    setShowForm(false);
    setUpdateForm(false);
    set_Id("");
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const skip = (pageNo - 1) * perPage;
      const response = await searchDrivers({
        skip,
        per_page: perPage,
        sorton: column,
        sortdir: sortDirection,
        match: query,
        status: selectedStatusFilter?.value || "",
      });

      const result = response.data?.data?.[0] || { count: 0, data: [] };
      setTotalRows(result.count || 0);
      setData(result.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [pageNo, perPage, column, sortDirection, query, selectedStatusFilter]);

  const handleSort = (sortedColumn, direction) => {
    setColumn(sortedColumn.sortField || "createdAt");
    setSortDirection(direction);
  };

  const handlePageChange = (page) => setPageNo(page);
  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setPageNo(page);
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (selectedOption) => {
    setValues({ ...values, status: selectedOption?.value || "" });
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleEdit = async (driverId) => {
    try {
      setIsLoading(true);
      const response = await getDriverById(driverId);
      const driver = response.data.data;
      set_Id(driverId);
      setValues({
        name: driver.name || "",
        licenseNumber: driver.licenseNumber || "",
        licenseCategory: driver.licenseCategory || "",
        licenseExpiryDate: driver.licenseExpiryDate ? new Date(driver.licenseExpiryDate).toISOString().split("T")[0] : "",
        contactNumber: driver.contactNumber || "",
        safetyScore: driver.safetyScore ?? "",
        status: driver.status || "Available",
      });
      setUpdateForm(true);
      setShowForm(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch driver details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (driverId) => {
    try {
      setIsDeleteLoading(true);
      await deleteDriver(driverId);
      toast.success("Driver deleted successfully");
      fetchDrivers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete driver");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const confirmDelete = async (driverId) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) {
      return;
    }

    setRemove_id(driverId);
    await handleDelete(driverId);
    setRemove_id("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);

    if (Object.keys(errors).length > 0) return;

    try {
      setIsLoading(true);
      const payload = {
        ...values,
        safetyScore: Number(values.safetyScore),
      };

      if (updateForm) {
        await updateDriver(_id, payload);
        toast.success("Driver updated successfully");
      } else {
        await createDriver(payload);
        toast.success("Driver created successfully");
      }

      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save driver");
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      name: "Sr No",
      selector: (_row, index) => index + 1,
      sortable: false,
      width: "80px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      sortField: "name",
    },
    {
      name: "License Number",
      selector: (row) => row.licenseNumber,
      sortable: true,
      sortField: "licenseNumber",
    },
    {
      name: "Category",
      selector: (row) => row.licenseCategory,
      sortable: true,
      sortField: "licenseCategory",
    },
    {
      name: "Expiry Date",
      selector: (row) => new Date(row.licenseExpiryDate).toLocaleDateString(),
      sortable: true,
      sortField: "licenseExpiryDate",
    },
    {
      name: "Contact",
      selector: (row) => row.contactNumber,
      sortable: true,
      sortField: "contactNumber",
    },
    {
      name: "Safety Score",
      selector: (row) => row.safetyScore,
      sortable: true,
      sortField: "safetyScore",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      sortField: "status",
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="d-flex gap-2">
          {currentPagePermissions?.edit && (
            <Button color="success" size="sm" onClick={() => handleEdit(row._id)}>
              Edit
            </Button>
          )}
          {currentPagePermissions?.delete && (
            <Button color="danger" size="sm" onClick={() => confirmDelete(row._id)}>
              Delete
            </Button>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
    },
  ];

  document.title = `Driver Master | ${adminData?.companyName || "TransitOps"}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb maintitle="Master" title="Driver Master" pageTitle="Master" />

          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
                    <div>
                      <h4 className="card-title mb-1">Driver Master</h4>
                      <p className="text-muted mb-0">Maintain driver profiles and safety details.</p>
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <div style={{ minWidth: 220 }}>
                        <Select
                          options={[{ value: "", label: "All Status" }, ...statusOptions]}
                          value={selectedStatusFilter}
                          onChange={setSelectedStatusFilter}
                          isClearable
                          placeholder="Filter by status"
                        />
                      </div>
                      <div style={{ minWidth: 220 }}>
                        <Input
                          type="text"
                          className="form-control"
                          placeholder="Search drivers..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                      {currentPagePermissions?.write && (
                        <Button color="success" onClick={handleAdd}>
                          <i className="ri-add-line align-bottom me-1"></i>
                          Add Driver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {(showForm || updateForm) ? (
                  <CardBody>
                    <Form onSubmit={(e) => e.preventDefault()}>
                      <Row>
                        <Col lg={4}>
                          <div className="form-floating mb-3">
                            <Input
                              type="text"
                              className="form-control"
                              name="name"
                              value={values.name}
                              onChange={handleChange}
                            />
                            <Label>Name <span className="text-danger">*</span></Label>
                            {isSubmit && <p className="text-danger mb-0">{formErrors.name}</p>}
                          </div>
                        </Col>
                        <Col lg={4}>
                          <div className="form-floating mb-3">
                            <Input
                              type="text"
                              className="form-control"
                              name="licenseNumber"
                              value={values.licenseNumber}
                              onChange={handleChange}
                            />
                            <Label>License Number <span className="text-danger">*</span></Label>
                            {isSubmit && <p className="text-danger mb-0">{formErrors.licenseNumber}</p>}
                          </div>
                        </Col>
                        <Col lg={4}>
                          <div className="form-floating mb-3">
                            <Input
                              type="text"
                              className="form-control"
                              name="licenseCategory"
                              value={values.licenseCategory}
                              onChange={handleChange}
                            />
                            <Label>License Category <span className="text-danger">*</span></Label>
                            {isSubmit && <p className="text-danger mb-0">{formErrors.licenseCategory}</p>}
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col lg={4}>
                          <div className="form-floating mb-3">
                            <Input
                              type="date"
                              className="form-control"
                              name="licenseExpiryDate"
                              value={values.licenseExpiryDate}
                              onChange={handleChange}
                            />
                            <Label>License Expiry Date <span className="text-danger">*</span></Label>
                            {isSubmit && <p className="text-danger mb-0">{formErrors.licenseExpiryDate}</p>}
                          </div>
                        </Col>
                        <Col lg={4}>
                          <div className="form-floating mb-3">
                            <Input
                              type="text"
                              className="form-control"
                              name="contactNumber"
                              value={values.contactNumber}
                              onChange={handleChange}
                            />
                            <Label>Contact Number <span className="text-danger">*</span></Label>
                            {isSubmit && <p className="text-danger mb-0">{formErrors.contactNumber}</p>}
                          </div>
                        </Col>
                        <Col lg={4}>
                          <div className="form-floating mb-3">
                            <Input
                              type="number"
                              className="form-control"
                              name="safetyScore"
                              value={values.safetyScore}
                              onChange={handleChange}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                            <Label>Safety Score <span className="text-danger">*</span></Label>
                            {isSubmit && <p className="text-danger mb-0">{formErrors.safetyScore}</p>}
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col lg={4}>
                          <div className="mb-3">
                            <Label className="form-label">Status <span className="text-danger">*</span></Label>
                            <Select
                              options={statusOptions}
                              value={statusValue}
                              onChange={handleStatusChange}
                              placeholder="Select status"
                            />
                            {isSubmit && <p className="text-danger mb-0">{formErrors.status}</p>}
                          </div>
                        </Col>
                      </Row>

                      <Row className="mt-4">
                        <Col lg={12}>
                          {updateForm ? (
                            <FormUpdateFooter
                              handleUpdate={handleSubmit}
                              handleUpdateCancel={handleCancel}
                              isLoading={isLoading}
                            />
                          ) : (
                            <FormsFooter
                              handleSubmit={handleSubmit}
                              handleSubmitCancel={handleCancel}
                              isLoading={isLoading}
                            />
                          )}
                        </Col>
                      </Row>
                    </Form>
                  </CardBody>
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={columns}
                        data={data}
                        progressPending={loading}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={perPage}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                        sortServer
                        onSort={handleSort}
                      />
                    </div>
                  </CardBody>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DriverMaster;
