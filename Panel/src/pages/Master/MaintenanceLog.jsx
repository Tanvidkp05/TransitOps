import React, { useState, useEffect, useContext, useRef } from "react";
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
    createMaintenanceLog,
    deleteMaintenanceLog,
    getMaintenanceLogById,
    updateMaintenanceLog,
    searchMaintenanceLogs,
} from "../../api/maintenanceLogs.api";
import { getAllVehicles } from "../../api/vehicles.api";

const initialState = {
    vehicle_id: "",
    issue_type: "",
    description: "",
    cost: "",
    status: "Active",
    opened_at: new Date().toISOString().split("T")[0],
    closed_at: "",
    isActive: true,
};

const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Closed", label: "Closed" },
];

const MaintenanceLog = () => {
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

    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [query, setQuery] = useState("");
    const [editId, setEditId] = useState("");
    const [removeId, setRemoveId] = useState("");
    const [modalDelete, setModalDelete] = useState(false);

    // Image upload states
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [showFileInput, setShowFileInput] = useState(true);
    const [removeImageFlag, setRemoveImageFlag] = useState(false);
    const fileInputRef = useRef(null);

    // Datatable states
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);
    const [sortColumn, setSortColumn] = useState("");
    const [sortDirection, setSortDirection] = useState("");

    // Load active vehicles for dropdown
    const loadVehicles = async () => {
        try {
            const res = await getAllVehicles();
            if (res.data?.isOk) {
                setVehicles(res.data.data || []);
            }
        } catch (error) {
            console.error("Error loading vehicles for select:", error);
            toast.error("Failed to load vehicle options");
        }
    };

    useEffect(() => {
        loadVehicles();
    }, []);

    const fetchLogsList = async () => {
        setIsPageLoading(true);
        let skip = (pageNo - 1) * perPage;
        if (skip < 0) {
            skip = 0;
        }

        try {
            const response = await searchMaintenanceLogs({
                skip: skip,
                per_page: perPage,
                sorton: sortColumn,
                sortdir: sortDirection,
                match: query,
                isActive: filter,
            });

            if (response.data?.data?.length > 0) {
                const res = response.data.data[0];
                setLogs(res.data || []);
                setTotalRows(res.count || 0);
            } else {
                setLogs([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching maintenance logs:", error);
            setLogs([]);
            setTotalRows(0);
            toast.error("Failed to fetch maintenance logs");
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        if (view === "LIST") {
            fetchLogsList();
        }
    }, [pageNo, perPage, sortColumn, sortDirection, query, filter, view]);

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size should not exceed 5MB");
                e.target.value = "";
                return;
            }
            if (!file.type.startsWith("image/")) {
                toast.error("Only image files are allowed");
                e.target.value = "";
                return;
            }
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
            setShowFileInput(false);
            setRemoveImageFlag(false);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setImagePreview("");
        setRemoveImageFlag(true);
        setShowFileInput(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleAddClick = () => {
        setValues({
            ...initialState,
            opened_at: new Date().toISOString().split("T")[0],
        });
        setSelectedFile(null);
        setImagePreview("");
        setShowFileInput(true);
        setRemoveImageFlag(false);
        setFormErrors({});
        setIsSubmit(false);
        setView("ADD");
    };

    const handleEditClick = (id) => {
        setEditId(id);
        setIsLoading(true);
        getMaintenanceLogById(id)
            .then((res) => {
                if (res.data?.data) {
                    const data = res.data.data;
                    setValues({
                        vehicle_id: data.vehicle_id?._id || data.vehicle_id || "",
                        issue_type: data.issue_type,
                        description: data.description || "",
                        cost: data.cost,
                        status: data.status,
                        opened_at: data.opened_at ? new Date(data.opened_at).toISOString().split("T")[0] : "",
                        closed_at: data.closed_at ? new Date(data.closed_at).toISOString().split("T")[0] : "",
                        isActive: data.isActive,
                    });

                    if (data.image) {
                        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
                        setImagePreview(`${apiUrl}/${data.image}`);
                        setShowFileInput(false);
                    } else {
                        setImagePreview("");
                        setShowFileInput(true);
                    }
                    setRemoveImageFlag(false);
                    setSelectedFile(null);
                    setFormErrors({});
                    setIsSubmit(false);
                    setView("EDIT");
                }
            })
            .catch((err) => {
                console.error("Error fetching maintenance log details:", err);
                toast.error("Failed to load maintenance log details");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleCancelClick = () => {
        setView("LIST");
        setValues(initialState);
        setSelectedFile(null);
        setImagePreview("");
        setRemoveImageFlag(false);
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
        if (!fields.vehicle_id) {
            errors.vehicle_id = "Vehicle selection is required";
        }
        if (!fields.issue_type.trim()) {
            errors.issue_type = "Issue type is required";
        }
        if (fields.cost === "" || isNaN(fields.cost) || Number(fields.cost) < 0) {
            errors.cost = "Cost must be a positive number";
        }
        if (!fields.opened_at) {
            errors.opened_at = "Opening date is required";
        }
        if (fields.status === "Closed" && !fields.closed_at) {
            errors.closed_at = "Closing date is required when status is Closed";
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
            const formData = new FormData();
            
            formData.append("vehicle_id", values.vehicle_id);
            formData.append("issue_type", values.issue_type.trim());
            formData.append("description", values.description.trim());
            formData.append("cost", values.cost);
            formData.append("status", values.status);
            formData.append("opened_at", values.opened_at);
            
            if (values.status === "Closed" && values.closed_at) {
                formData.append("closed_at", values.closed_at);
            }
            
            formData.append("isActive", values.isActive);

            if (selectedFile) {
                formData.append("image", selectedFile);
            }
            if (removeImageFlag) {
                formData.append("removeImage", "true");
            }

            if (view === "ADD") {
                createMaintenanceLog(formData)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Maintenance Log Added Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to add maintenance log");
                        }
                    })
                    .catch((err) => {
                        console.error("Error creating maintenance log:", err);
                        toast.error(err.response?.data?.message || "Failed to add maintenance log");
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } else if (view === "EDIT") {
                updateMaintenanceLog(editId, formData)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Maintenance Log Updated Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to update maintenance log");
                        }
                    })
                    .catch((err) => {
                        console.error("Error updating maintenance log:", err);
                        toast.error(err.response?.data?.message || "Failed to update maintenance log");
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
        deleteMaintenanceLog(removeId)
            .then(() => {
                setModalDelete(false);
                toast.success("Maintenance Log Removed Successfully!");
                fetchLogsList();
            })
            .catch((err) => {
                console.error("Error deleting maintenance log:", err);
                toast.error("Failed to remove maintenance log");
            })
            .finally(() => {
                setIsDeleteLoading(false);
            });
    };

    const vehicleSelectOptions = vehicles.map(v => ({
        value: v._id,
        label: `${v.registration_number} (${v.name_model}) - ${v.status}`
    }));

    const col = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: false,
            maxWidth: "20px",
        },
        {
            name: "Receipt / Photo",
            selector: (row) => {
                if (row.image) {
                    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
                    return (
                        <img
                            src={`${apiUrl}/${row.image}`}
                            alt="Receipt"
                            style={{
                                width: "45px",
                                height: "35px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                border: "1px solid #ddd",
                            }}
                        />
                    );
                }
                return <span className="text-muted">No File</span>;
            },
            maxWidth: "85px",
        },
        {
            name: "Vehicle Reg",
            selector: (row) => row.vehicle_registration_number || "N/A",
            sortable: true,
            sortField: "vehicle_registration_number",
            minWidth: "120px",
        },
        {
            name: "Model",
            selector: (row) => row.vehicle_name_model || "N/A",
            sortable: true,
            sortField: "vehicle_name_model",
            minWidth: "120px",
        },
        {
            name: "Issue Type",
            selector: (row) => row.issue_type,
            sortable: true,
            sortField: "issue_type",
            minWidth: "120px",
        },
        {
            name: "Cost",
            selector: (row) => `$${row.cost}`,
            sortable: true,
            sortField: "cost",
            minWidth: "90px",
        },
        {
            name: "Opened At",
            selector: (row) => row.opened_at ? new Date(row.opened_at).toLocaleDateString() : "N/A",
            sortable: true,
            sortField: "opened_at",
            minWidth: "110px",
        },
        {
            name: "Closed At",
            selector: (row) => row.closed_at ? new Date(row.closed_at).toLocaleDateString() : "-",
            sortable: true,
            sortField: "closed_at",
            minWidth: "110px",
        },
        {
            name: "Status",
            selector: (row) => {
                let badgeClass = "badge bg-info-subtle text-info";
                if (row.status === "Active") badgeClass = "badge bg-warning-subtle text-warning";
                else if (row.status === "Closed") badgeClass = "badge bg-success-subtle text-success";

                return <span className={badgeClass}>{row.status}</span>;
            },
            minWidth: "90px",
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

    document.title = `Maintenance Logs | ${adminData?.companyName || "TransitOps"}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {view === "LIST" && (
                        <>
                            <BreadCrumb
                                maintitle="Master"
                                title="Maintenance Logs"
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader>
                                            <FormsHeader
                                                formName="Maintenance Logs"
                                                filter={filter}
                                                handleFilter={handleFilter}
                                                tog_list={handleAddClick}
                                                setQuery={setQuery}
                                                showAddButton={currentPagePermissions?.write}
                                            />
                                        </CardHeader>
                                        <CardBody>
                                            <div id="maintenanceList">
                                                <div className="table-responsive table-card mt-1 mb-1 text-right">
                                                    <DataTable
                                                        columns={col}
                                                        data={logs}
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
                                title={view === "ADD" ? "Add Maintenance Log" : "Edit Maintenance Log"}
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader className="align-items-center d-flex">
                                            <h4 className="card-title mb-0 flex-grow-1">
                                                {view === "ADD" ? "Create New Maintenance Log" : "Update Maintenance Log"}
                                            </h4>
                                        </CardHeader>
                                        <CardBody>
                                            <form onSubmit={handleSubmit}>
                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="vehicle_id">Select Vehicle <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="vehicle_id"
                                                                options={vehicleSelectOptions}
                                                                value={vehicleSelectOptions.find(opt => opt.value === values.vehicle_id) || null}
                                                                onChange={(selected) => setValues({ ...values, vehicle_id: selected ? selected.value : "" })}
                                                                placeholder="Select Vehicle..."
                                                                isDisabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.vehicle_id && (
                                                                <span className="text-danger">{formErrors.vehicle_id}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="issue_type">Issue Type <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="issue_type"
                                                                id="issue_type"
                                                                placeholder="e.g. Engine Overheating, Brake Repair"
                                                                value={values.issue_type}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.issue_type && (
                                                                <span className="text-danger">{formErrors.issue_type}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="cost">Maintenance Cost ($) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="cost"
                                                                id="cost"
                                                                placeholder="e.g. 250"
                                                                value={values.cost}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.cost && (
                                                                <span className="text-danger">{formErrors.cost}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="maintenance-status">Maintenance Status <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="maintenance-status"
                                                                options={statusOptions}
                                                                value={statusOptions.find(opt => opt.value === values.status) || null}
                                                                onChange={(selected) => setValues({ ...values, status: selected ? selected.value : "Active" })}
                                                                placeholder="Select Status..."
                                                                isDisabled={isLoading}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="opened_at">Opened At <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="date"
                                                                name="opened_at"
                                                                id="opened_at"
                                                                value={values.opened_at}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.opened_at && (
                                                                <span className="text-danger">{formErrors.opened_at}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    {values.status === "Closed" && (
                                                        <Col md={6}>
                                                            <FormGroup className="mb-3">
                                                                <Label for="closed_at">Closed At <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    type="date"
                                                                    name="closed_at"
                                                                    id="closed_at"
                                                                    value={values.closed_at}
                                                                    onChange={handleChange}
                                                                    disabled={isLoading}
                                                                />
                                                                {isSubmit && formErrors.closed_at && (
                                                                    <span className="text-danger">{formErrors.closed_at}</span>
                                                                )}
                                                            </FormGroup>
                                                        </Col>
                                                    )}
                                                </Row>

                                                <Row>
                                                    <Col md={12}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="description">Detailed Description</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="description"
                                                                id="description"
                                                                rows="3"
                                                                placeholder="Describe the issue and actions taken..."
                                                                value={values.description}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mt-2 mb-3 d-flex align-items-center">
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

                                                <Row className="mb-4">
                                                    <Col md={12}>
                                                        <FormGroup>
                                                            <Label>Receipt or Photo</Label>
                                                            {showFileInput ? (
                                                                <input
                                                                    type="file"
                                                                    name="image"
                                                                    className="form-control"
                                                                    accept=".jpg, .jpeg, .png"
                                                                    onChange={handleFileChange}
                                                                    ref={fileInputRef}
                                                                    disabled={isLoading}
                                                                />
                                                            ) : null}

                                                            {imagePreview && (
                                                                <div style={{ position: "relative", display: "inline-block", marginTop: "15px" }}>
                                                                    <img
                                                                        src={imagePreview}
                                                                        alt="Receipt Preview"
                                                                        style={{
                                                                            width: "150px",
                                                                            height: "100px",
                                                                            objectFit: "cover",
                                                                            border: "1px solid #ccc",
                                                                            borderRadius: "4px",
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleRemoveImage}
                                                                        style={{
                                                                            position: "absolute",
                                                                            top: "-8px",
                                                                            right: "-8px",
                                                                            backgroundColor: "#f06548",
                                                                            color: "#fff",
                                                                            border: "none",
                                                                            borderRadius: "50%",
                                                                            width: "22px",
                                                                            height: "22px",
                                                                            cursor: "pointer",
                                                                            fontSize: "12px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                        }}
                                                                        title="Remove File"
                                                                        disabled={isLoading}
                                                                    >
                                                                        X
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <div className="d-flex justify-content-end gap-2">
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

export default MaintenanceLog;
