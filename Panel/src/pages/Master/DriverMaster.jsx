import React, { useState, useEffect, useContext } from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Label,
    Input,
    Row,
    FormGroup,
} from "reactstrap";
import DataTable from "react-data-table-component";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsModalHeader";
import { toast } from "react-toastify";
import Select from "react-select";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import {
    createDriver,
    deleteDriver,
    getDriverById,
    updateDriver,
    searchDrivers,
    getAllDrivers,
} from "../../api/drivers.api";

const initialState = {
    name: "",
    email: "",
    licenseNumber: "",
    licenseCategory: "",
    licenseExpiryDate: "",
    contactNumber: "",
    safetyScore: "",
    status: "Available",
    isActive: true,
};

const statusOptions = [
    { value: "Available", label: "Available" },
    { value: "On Trip", label: "On Trip" },
    { value: "Off Duty", label: "Off Duty" },
    { value: "Suspended", label: "Suspended" },
];

const DriverMaster = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);

    const [view, setView] = useState("LIST"); // "LIST", "ADD", "EDIT"
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);

    const [drivers, setDrivers] = useState([]);
    const [query, setQuery] = useState("");
    const [editId, setEditId] = useState("");
    const [removeId, setRemoveId] = useState("");
    const [modalDelete, setModalDelete] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [stats, setStats] = useState({
        Available: 0,
        "On Trip": 0,
        "Off Duty": 0,
        "Suspended": 0,
    });

    // Datatable states
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);
    const [sortColumn, setSortColumn] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");

    const fetchDriverStats = async () => {
        try {
            const response = await getAllDrivers();
            if (response.data?.data) {
                const data = response.data.data;
                const counts = {
                    Available: data.filter(d => d.status === "Available" && d.isActive === filter).length,
                    "On Trip": data.filter(d => d.status === "On Trip" && d.isActive === filter).length,
                    "Off Duty": data.filter(d => d.status === "Off Duty" && d.isActive === filter).length,
                    "Suspended": data.filter(d => d.status === "Suspended" && d.isActive === filter).length,
                };
                setStats(counts);
            }
        } catch (error) {
            console.error("Error fetching driver stats:", error);
        }
    };

    const handleStatusFilterToggle = (status) => {
        setPageNo(1);
        if (selectedStatus === status) {
            setSelectedStatus("");
        } else {
            setSelectedStatus(status);
        }
    };

    const fetchDriversList = async () => {
        setIsPageLoading(true);
        let skip = (pageNo - 1) * perPage;
        if (skip < 0) {
            skip = 0;
        }

        try {
            const response = await searchDrivers({
                skip: skip,
                per_page: perPage,
                sorton: sortColumn,
                sortdir: sortDirection,
                match: query,
                isActive: filter,
                status: selectedStatus,
            });

            if (response.data?.data?.length > 0) {
                const res = response.data.data[0];
                setDrivers(res.data || []);
                setTotalRows(res.count || 0);
            } else {
                setDrivers([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching drivers list:", error);
            setDrivers([]);
            setTotalRows(0);
            toast.error("Failed to fetch drivers list");
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        if (view === "LIST") {
            fetchDriversList();
            fetchDriverStats();
        }
    }, [pageNo, perPage, sortColumn, sortDirection, query, filter, view, selectedStatus]);

    const handleSort = (column, direction) => {
        setSortColumn(column.sortField);
        setSortDirection(direction);
    };

    const handlePageChange = (page) => {
        setPageNo(page);
    };

    const handlePerRowsChange = async (newPerPage) => {
        setPerPage(newPerPage);
    };

    const handleFilter = (e) => {
        setPageNo(1);
        setFilter(e.target.checked);
    };

    const handleAddClick = () => {
        setValues(initialState);
        setFormErrors({});
        setIsSubmit(false);
        setView("ADD");
    };

    const handleEditClick = (id) => {
        setEditId(id);
        setIsLoading(true);
        getDriverById(id)
            .then((res) => {
                if (res.data?.data) {
                    const data = res.data.data;
                    setValues({
                        name: data.name,
                        email: data.email || "",
                        licenseNumber: data.licenseNumber,
                        licenseCategory: data.licenseCategory,
                        licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate).toISOString().split("T")[0] : "",
                        contactNumber: data.contactNumber,
                        safetyScore: data.safetyScore ?? "",
                        status: data.status,
                        isActive: data.isActive !== undefined ? data.isActive : true,
                    });
                    setFormErrors({});
                    setIsSubmit(false);
                    setView("EDIT");
                }
            })
            .catch((err) => {
                console.error("Error fetching driver details:", err);
                toast.error("Failed to load driver details");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleCancelClick = () => {
        setView("LIST");
        setValues(initialState);
        setFormErrors({});
        setIsSubmit(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues({ ...values, [name]: value });
    };

    const handleCheck = (e) => {
        const { name, checked } = e.target;
        setValues({ ...values, [name]: checked });
    };

    const validate = (fields) => {
        const errors = {};
        if (!fields.name.trim()) {
            errors.name = "Driver name is required";
        }
        if (!fields.email.trim()) {
            errors.email = "Email address is required";
        } else if (!/\S+@\S+\.\S+/.test(fields.email)) {
            errors.email = "Invalid email format";
        }
        if (!fields.licenseNumber.trim()) {
            errors.licenseNumber = "License number is required";
        }
        if (!fields.licenseCategory.trim()) {
            errors.licenseCategory = "License category is required";
        }
        if (!fields.licenseExpiryDate) {
            errors.licenseExpiryDate = "License expiry date is required";
        }
        if (!fields.contactNumber.trim()) {
            errors.contactNumber = "Contact number is required";
        }
        if (fields.safetyScore === "" || isNaN(fields.safetyScore)) {
            errors.safetyScore = "Safety score is required and must be a number";
        } else {
            const score = Number(fields.safetyScore);
            if (score < 0 || score > 100) {
                errors.safetyScore = "Safety score must be between 0 and 100";
            }
        }
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = validate(values);
        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length === 0) {
            setIsLoading(true);
            const payload = {
                ...values,
                name: values.name.trim(),
                email: values.email.trim(),
                licenseNumber: values.licenseNumber.trim(),
                licenseCategory: values.licenseCategory.trim(),
                contactNumber: values.contactNumber.trim(),
                safetyScore: Number(values.safetyScore),
            };

            if (view === "ADD") {
                createDriver(payload)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Driver Added Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to add driver");
                        }
                    })
                    .catch((err) => {
                        console.error("Error creating driver:", err);
                        toast.error(err.response?.data?.message || "Failed to add driver");
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } else if (view === "EDIT") {
                updateDriver(editId, payload)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Driver Updated Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to update driver");
                        }
                    })
                    .catch((err) => {
                        console.error("Error updating driver:", err);
                        toast.error(err.response?.data?.message || "Failed to update driver");
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            }
        }
    };

    const handleDeleteClick = (id) => {
        setRemoveId(id);
        setModalDelete(true);
    };

    const confirmDelete = (e) => {
        e.preventDefault();
        setIsDeleteLoading(true);
        deleteDriver(removeId)
            .then(() => {
                setModalDelete(false);
                toast.success("Driver Removed Successfully!");
                fetchDriversList();
            })
            .catch((err) => {
                console.error("Error deleting driver:", err);
                toast.error("Failed to remove driver");
            })
            .finally(() => {
                setIsDeleteLoading(false);
            });
    };

    const col = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: false,
            maxWidth: "20px",
        },
        {
            name: "Name",
            selector: (row) => row.name,
            sortable: true,
            sortField: "name",
            minWidth: "130px",
        },
        {
            name: "Email",
            selector: (row) => row.email,
            sortable: true,
            sortField: "email",
            minWidth: "150px",
        },
        {
            name: "License Number",
            selector: (row) => row.licenseNumber,
            sortable: true,
            sortField: "licenseNumber",
            minWidth: "130px",
        },
        {
            name: "Category",
            selector: (row) => row.licenseCategory,
            sortable: true,
            sortField: "licenseCategory",
            minWidth: "100px",
        },
        {
            name: "Expiry Date",
            selector: (row) => new Date(row.licenseExpiryDate).toLocaleDateString(),
            sortable: true,
            sortField: "licenseExpiryDate",
            minWidth: "120px",
        },
        {
            name: "Contact",
            selector: (row) => row.contactNumber,
            sortable: true,
            sortField: "contactNumber",
            minWidth: "120px",
        },
        {
            name: "Safety Score",
            selector: (row) => `${row.safetyScore}/100`,
            sortable: true,
            sortField: "safetyScore",
            minWidth: "110px",
        },
        {
            name: "Status",
            selector: (row) => {
                let badgeClass = "badge bg-info-subtle text-info";
                if (row.status === "Available") badgeClass = "badge bg-success-subtle text-success";
                else if (row.status === "On Trip") badgeClass = "badge bg-primary-subtle text-primary";
                else if (row.status === "Off Duty") badgeClass = "badge bg-secondary-subtle text-secondary";
                else if (row.status === "Suspended") badgeClass = "badge bg-danger-subtle text-danger";

                return <span className={badgeClass}>{row.status}</span>;
            },
            minWidth: "100px",
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
                                        onClick={() => handleEditClick(row._id)}
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            <div className="remove">
                                {currentPagePermissions?.delete && (
                                    <button
                                        className="btn btn-sm btn-danger remove-item-btn"
                                        onClick={() => handleDeleteClick(row._id)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            {!currentPagePermissions?.edit && !currentPagePermissions?.delete && (
                                <span className="text-muted">No actions</span>
                            )}
                        </div>
                    </React.Fragment>
                );
            },
            sortable: false,
            minWidth: "140px",
        },
    ];

    document.title = `Driver Master | ${adminData?.companyName || "TransitOps"}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {view === "LIST" && (
                        <>
                            <BreadCrumb
                                maintitle="Master"
                                title="Driver"
                                pageTitle="Master"
                            />
                            
                            {/* Driver Stats Widgets */}
                            <Row className="mb-4">
                                <Col xl={3} md={6}>
                                    <Card 
                                        className={`card-animate cursor-pointer border ${selectedStatus === "Available" ? "border-success shadow-lg" : "border-light"}`} 
                                        onClick={() => handleStatusFilterToggle("Available")}
                                        style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                                    >
                                        <CardBody className="p-3">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 fs-12">Available Drivers</p>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-end justify-content-between mt-3">
                                                <div>
                                                    <h4 className="fs-22 fw-semibold ff-secondary mb-0">{stats.Available}</h4>
                                                </div>
                                                <div className="avatar-sm flex-shrink-0">
                                                    <span className="avatar-title bg-soft-success rounded fs-3 p-2">
                                                        <i className="ri-checkbox-circle-line text-success"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col xl={3} md={6}>
                                    <Card 
                                        className={`card-animate cursor-pointer border ${selectedStatus === "On Trip" ? "border-primary shadow-lg" : "border-light"}`} 
                                        onClick={() => handleStatusFilterToggle("On Trip")}
                                        style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                                    >
                                        <CardBody className="p-3">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 fs-12">On Trip</p>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-end justify-content-between mt-3">
                                                <div>
                                                    <h4 className="fs-22 fw-semibold ff-secondary mb-0">{stats["On Trip"]}</h4>
                                                </div>
                                                <div className="avatar-sm flex-shrink-0">
                                                    <span className="avatar-title bg-soft-primary rounded fs-3 p-2">
                                                        <i className="ri-route-line text-primary"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col xl={3} md={6}>
                                    <Card 
                                        className={`card-animate cursor-pointer border ${selectedStatus === "Off Duty" ? "border-secondary shadow-lg" : "border-light"}`} 
                                        onClick={() => handleStatusFilterToggle("Off Duty")}
                                        style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                                    >
                                        <CardBody className="p-3">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 fs-12">Off Duty</p>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-end justify-content-between mt-3">
                                                <div>
                                                    <h4 className="fs-22 fw-semibold ff-secondary mb-0">{stats["Off Duty"]}</h4>
                                                </div>
                                                <div className="avatar-sm flex-shrink-0">
                                                    <span className="avatar-title bg-soft-secondary rounded fs-3 p-2">
                                                        <i className="ri-shut-down-line text-secondary"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col xl={3} md={6}>
                                    <Card 
                                        className={`card-animate cursor-pointer border ${selectedStatus === "Suspended" ? "border-danger shadow-lg" : "border-light"}`} 
                                        onClick={() => handleStatusFilterToggle("Suspended")}
                                        style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                                    >
                                        <CardBody className="p-3">
                                            <div className="d-flex align-items-center">
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <p className="text-uppercase fw-semibold text-muted text-truncate mb-0 fs-12">Suspended</p>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-end justify-content-between mt-3">
                                                <div>
                                                    <h4 className="fs-22 fw-semibold ff-secondary mb-0">{stats.Suspended}</h4>
                                                </div>
                                                <div className="avatar-sm flex-shrink-0">
                                                    <span className="avatar-title bg-soft-danger rounded fs-3 p-2">
                                                        <i className="ri-error-warning-line text-danger"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader>
                                            <FormsHeader
                                                formName="Driver"
                                                filter={filter}
                                                handleFilter={handleFilter}
                                                tog_list={handleAddClick}
                                                setQuery={setQuery}
                                                showAddButton={currentPagePermissions?.write}
                                            />
                                        </CardHeader>
                                        <CardBody>
                                            <div id="driverList">
                                                <div className="table-responsive table-card mt-1 mb-1 text-right">
                                                    <DataTable
                                                        columns={col}
                                                        data={drivers}
                                                        progressPending={isPageLoading}
                                                        sortServer
                                                        onSort={(column, direction) => {
                                                            handleSort(column, direction);
                                                        }}
                                                        pagination
                                                        paginationServer
                                                        paginationTotalRows={totalRows}
                                                        paginationPerPage={100}
                                                        paginationRowsPerPageOptions={[50, 100, 200, 300, totalRows]}
                                                        onChangeRowsPerPage={handlePerRowsChange}
                                                        onChangePage={handlePageChange}
                                                    />
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}

                    {(view === "ADD" || view === "EDIT") && (
                        <>
                            <BreadCrumb
                                maintitle="Master"
                                title={view === "ADD" ? "Add Driver" : "Edit Driver"}
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader className="align-items-center d-flex">
                                            <h4 className="card-title mb-0 flex-grow-1">
                                                {view === "ADD" ? "Create New Driver" : "Update Driver"}
                                            </h4>
                                        </CardHeader>
                                        <CardBody>
                                            <form onSubmit={handleSubmit}>
                                                <Row>
                                                    <Col md={4}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="name">Driver Name <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="name"
                                                                id="name"
                                                                placeholder="e.g. John Doe"
                                                                value={values.name}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.name && (
                                                                <span className="text-danger">{formErrors.name}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={4}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="email">Email Address <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="email"
                                                                name="email"
                                                                id="email"
                                                                placeholder="e.g. driver@transitops.com"
                                                                value={values.email}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.email && (
                                                                <span className="text-danger">{formErrors.email}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={4}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="licenseNumber">License Number <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="licenseNumber"
                                                                id="licenseNumber"
                                                                placeholder="e.g. DL-123456789"
                                                                value={values.licenseNumber}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.licenseNumber && (
                                                                <span className="text-danger">{formErrors.licenseNumber}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="licenseCategory">License Category <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="licenseCategory"
                                                                id="licenseCategory"
                                                                placeholder="e.g. Class A CDL"
                                                                value={values.licenseCategory}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.licenseCategory && (
                                                                <span className="text-danger">{formErrors.licenseCategory}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="licenseExpiryDate">License Expiry Date <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="date"
                                                                name="licenseExpiryDate"
                                                                id="licenseExpiryDate"
                                                                value={values.licenseExpiryDate}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.licenseExpiryDate && (
                                                                <span className="text-danger">{formErrors.licenseExpiryDate}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="contactNumber">Contact Number <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="contactNumber"
                                                                id="contactNumber"
                                                                placeholder="e.g. +1 234 567 8900"
                                                                value={values.contactNumber}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.contactNumber && (
                                                                <span className="text-danger">{formErrors.contactNumber}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="safetyScore">Safety Score (0 - 100) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="safetyScore"
                                                                id="safetyScore"
                                                                placeholder="e.g. 95"
                                                                value={values.safetyScore}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                                min="0"
                                                                max="100"
                                                            />
                                                            {isSubmit && formErrors.safetyScore && (
                                                                <span className="text-danger">{formErrors.safetyScore}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="driver-status">Status <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="driver-status"
                                                                options={statusOptions}
                                                                value={statusOptions.find(opt => opt.value === values.status) || null}
                                                                onChange={(selected) => setValues({ ...values, status: selected ? selected.value : "Available" })}
                                                                placeholder="Select Status..."
                                                                isDisabled={isLoading}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mt-4 mb-3 d-flex align-items-center">
                                                            <div className="form-check form-switch form-switch-md">
                                                                <Input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    name="isActive"
                                                                    id="isActive"
                                                                    checked={values.isActive}
                                                                    onChange={handleCheck}
                                                                    disabled={isLoading}
                                                                />
                                                                <Label className="form-check-label ms-2" for="isActive">
                                                                    Is Active
                                                                </Label>
                                                            </div>
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <div className="d-flex justify-content-end gap-2 mt-4">
                                                    <Button
                                                        color="light"
                                                        type="button"
                                                        onClick={handleCancelClick}
                                                        disabled={isLoading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        color="success"
                                                        type="submit"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? "Saving..." : (view === "ADD" ? "Submit" : "Update")}
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </Container>
            </div>

            <DeleteModal
                show={modalDelete}
                onDeleteClick={confirmDelete}
                onCloseClick={() => setModalDelete(false)}
                isLoading={isDeleteLoading}
            />
        </React.Fragment>
    );
};

export default DriverMaster;
