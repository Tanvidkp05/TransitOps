import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Label,
  Input,
  Row,
} from "reactstrap";
import DataTable from "react-data-table-component";
import {
  createVehicleType,
  getVehicleTypeById,
  deleteVehicleType,
  updateVehicleType,
  searchVehicleTypes,
} from "../../api/vehicleTypes.api";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import FormUpdateFooter from "../../Components/Common/FormUpdateFooter";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import ReferenceErrorModal from "../../Components/Common/ReferenceErrorModal";

const initialState = {
  name: "",
  isActive: true,
};

const VehicleType = () => {
  const { adminData } = useContext(AuthContext);
  const { currentPagePermissions } = useContext(MenuContext);
  const [values, setValues] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);

  const [query, setQuery] = useState("");

  // Separate loading states for different operations
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isEditFetching, setIsEditFetching] = useState(false);

  const [_id, set_Id] = useState("");
  const [remove_id, setRemove_id] = useState("");

  const [vehicleTypes, setVehicleTypes] = useState([]);

  useEffect(() => {
    if (Object.keys(formErrors).length === 0 && isSubmit) {
      console.log("no errors");
    }
  }, [formErrors, isSubmit]);

  const [modal_list, setmodal_list] = useState(false);
  const tog_list = () => {
    setmodal_list(!modal_list);
    setValues(initialState);
    setIsSubmit(false);
  };

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(id);
  };

  const [referenceModal, setReferenceModal] = useState(false);
  const [referenceData, setReferenceData] = useState(null);

  const [modal_edit, setmodal_edit] = useState(false);
  const handleTog_edit = (id) => {
    setmodal_edit(!modal_edit);
    setIsSubmit(false);
    set_Id(id);
    setIsEditFetching(true);
    getVehicleTypeById(id)
      .then((res) => {
        setValues({
          name: res.data.data.name,
          isActive: res.data.data.isActive,
        });
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed to fetch vehicle type details");
      })
      .finally(() => {
        setIsEditFetching(false);
      });
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleCheck = (e) => {
    setValues({ ...values, isActive: e.target.checked });
  };

  const handleSubmitCancel = () => {
    setmodal_list(false);
    setValues(initialState);
    setIsSubmit(false);
  };

  const handleClick = (e) => {
    e.preventDefault();
    setFormErrors({});
    let errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsSubmitLoading(true);
      createVehicleType(values)
        .then((res) => {
          if (res.data.isOk) {
            toast.success("Vehicle Type Added Successfully!");
            setmodal_list(!modal_list);
            setValues(initialState);
            fetchVehicleTypes();
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error(error.response?.data?.message || "Failed to add vehicle type. Please try again.");
        })
        .finally(() => {
          setIsSubmitLoading(false);
        });
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);
    deleteVehicleType(remove_id)
      .then((res) => {
        setmodal_delete(!modal_delete);
        fetchVehicleTypes();
        toast.success("Vehicle Type Removed Successfully!");
      })
      .catch((err) => {
        console.log(err);
        setmodal_delete(false);

        if (err.response && err.response.status === 409) {
          // Handle reference error
          setReferenceData(err.response.data);
          setReferenceModal(true);
        } else {
          toast.error("Failed to delete vehicle type. Please try again.");
        }
      })
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleUpdateCancel = (e) => {
    setmodal_edit(false);
    setIsSubmit(false);
    setFormErrors({});
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    let errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsUpdateLoading(true);
      updateVehicleType(_id, values)
        .then((res) => {
          setmodal_edit(!modal_edit);
          fetchVehicleTypes();
          toast.success("Vehicle Type Updated Successfully!");
        })
        .catch((err) => {
          console.log(err);
          toast.error(err.response?.data?.message || "Failed to update vehicle type. Please try again.");
        })
        .finally(() => {
          setIsUpdateLoading(false);
        });
    }
  };

  const validate = (values) => {
    const errors = {};

    if (!values.name || values.name.trim() === "") {
      errors.name = "Vehicle Type Name is required!";
    }

    return errors;
  };

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  useEffect(() => {
    fetchVehicleTypes();
  }, [pageNo, perPage, column, sortDirection, query, filter]);

  const fetchVehicleTypes = async () => {
    setLoading(true);
    let skip = (pageNo - 1) * perPage;
    if (skip < 0) {
      skip = 0;
    }

    await searchVehicleTypes({
      skip: skip,
      per_page: perPage,
      sorton: column,
      sortdir: sortDirection,
      match: query,
      isActive: filter,
    })
      .then((response) => {
        if (response.data.data.length > 0) {
          let res = response.data.data[0];
          setVehicleTypes(res.data || []);
          setTotalRows(res.count || 0);
        } else {
          setVehicleTypes([]);
          setTotalRows(0);
        }
      })
      .catch((err) => {
        console.error("Error fetching vehicle types:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handleReferenceModalClose = () => {
    setReferenceModal(false);
    setReferenceData(null);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
  };

  const handleFilter = (e) => {
    setFilter(e.target.checked);
  };

  const col = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      maxWidth: "20px",
    },
    {
      name: "Vehicle Type Name",
      selector: (row) => row.name,
      sortable: true,
      sortField: "name",
      minWidth: "150px",
    },
    {
      name: "Status",
      selector: (row) => (row.isActive ? "Active" : "Inactive"),
      minWidth: "150px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <React.Fragment>
            <div className="d-flex gap-2">
              <div className="edit">
                {currentPagePermissions?.edit && (
                  <button
                    className="btn btn-sm btn-success edit-item-btn"
                    data-bs-toggle="modal"
                    data-bs-target="#showModal"
                    onClick={() => handleTog_edit(row._id)}
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="remove">
                {currentPagePermissions?.delete && (
                  <button
                    className="btn btn-sm btn-danger remove-item-btn"
                    data-bs-toggle="modal"
                    data-bs-target="#deleteRecordModal"
                    onClick={() => tog_delete(row._id)}
                  >
                    Remove
                  </button>
                )}
              </div>
              {!currentPagePermissions?.edit && !currentPagePermissions?.delete && (
                <span className="text-muted">No actions available</span>
              )}
            </div>
          </React.Fragment>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  document.title = `Vehicle Type Master | ${adminData?.companyName || "TransitOps"}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb
            maintitle="Master"
            title="Vehicle Type Master"
            pageTitle="Master"
          />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Vehicle Type Master"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={tog_list}
                    setQuery={setQuery}
                    currentPagePermissions={currentPagePermissions}
                    showAddButton={currentPagePermissions?.write}
                  />
                </CardHeader>

                <CardBody>
                  <div id="vehicleTypeList">
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={col}
                        data={vehicleTypes}
                        progressPending={loading}
                        sortServer
                        onSort={(column, sortDirection) => {
                          handleSort(column, sortDirection);
                        }}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={100}
                        paginationRowsPerPageOptions={[
                          50, 100, 200, 300, totalRows,
                        ]}
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={modal_list}
        toggle={() => {
          tog_list();
        }}
        centered
      >
        <ModalHeader
          className="bg-light p-3"
          toggle={() => {
            setmodal_list(false);
            setIsSubmit(false);
          }}
        >
          Add Vehicle Type
        </ModalHeader>
        <form onSubmit={handleClick}>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Vehicle Type Name"
                required
                name="name"
                value={values.name}
                onChange={handleChange}
              />
              <Label>
                Vehicle Type Name <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && formErrors.name && (
                <p className="text-danger">{formErrors.name}</p>
              )}
            </div>
            <div className="mb-3 d-flex align-items-center">
              <div className="form-check form-switch form-switch-md">
                <Input
                  type="checkbox"
                  className="form-check-input"
                  name="isActive"
                  id="addIsActive"
                  checked={values.isActive}
                  onChange={handleCheck}
                />
                <Label className="form-check-label ms-2" htmlFor="addIsActive">Is Active</Label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <FormsFooter
              handleSubmit={handleClick}
              handleSubmitCancel={handleSubmitCancel}
              isLoading={isSubmitLoading}
            />
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modal_edit}
        toggle={() => {
          handleTog_edit();
        }}
        centered
      >
        <ModalHeader
          className="bg-light p-3"
          toggle={() => {
            setmodal_edit(false);
            setIsSubmit(false);
          }}
        >
          Edit Vehicle Type
        </ModalHeader>
        <form onSubmit={handleUpdate}>
          <ModalBody>
            <div className="form-floating mb-3">
              <Input
                type="text"
                placeholder="Enter Vehicle Type Name"
                required
                name="name"
                value={values.name}
                onChange={handleChange}
              />
              <Label>
                Vehicle Type Name <span className="text-danger">*</span>{" "}
              </Label>
              {isSubmit && formErrors.name && (
                <p className="text-danger">{formErrors.name}</p>
              )}
            </div>
            <div className="mb-3 d-flex align-items-center">
              <div className="form-check form-switch form-switch-md">
                <Input
                  type="checkbox"
                  className="form-check-input"
                  name="isActive"
                  id="editIsActive"
                  checked={values.isActive}
                  onChange={handleCheck}
                />
                <Label className="form-check-label ms-2" htmlFor="editIsActive">Is Active</Label>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <FormUpdateFooter
              handleUpdate={handleUpdate}
              handleUpdateCancel={handleUpdateCancel}
              isLoading={isUpdateLoading || isEditFetching}
            />
          </ModalFooter>
        </form>
      </Modal>

      <DeleteModal
        show={modal_delete}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
        disabled={isDeleteLoading}
      />

      <ReferenceErrorModal
        isOpen={referenceModal}
        toggle={handleReferenceModalClose}
        title="Cannot Delete Vehicle Type"
        referenceData={referenceData}
      />
    </React.Fragment>
  );
};

export default VehicleType;
