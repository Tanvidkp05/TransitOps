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
    createVehicle,
    deleteVehicle,
    getVehicleById,
    updateVehicle,
    searchVehicles,
} from "../../api/vehicles.api";
import { getAllVehicleTypes } from "../../api/vehicleTypes.api";

const initialState = {
    registration_number: "",
    name_model: "",
    type: "",
    max_load_capacity: "",
    odometer: "",
    acquisition_cost: "",
    status: "Available",
    region: "",
    isActive: true,
};

const statusOptions = [
    { value: "Available", label: "Available" },
    { value: "On Trip", label: "On Trip" },
    { value: "In Shop", label: "In Shop" },
    { value: "Retired", label: "Retired" },
];

const Vehicle = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);

    const [view, setView] = useState("LIST"); // "LIST", "ADD", "EDIT"
    const [typeOptions, setTypeOptions] = useState([]);
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);

    const [vehicles, setVehicles] = useState([]);
    const [query, setQuery] = useState("");
    const [selectedType, setSelectedType] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState([]);
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
    const [sortColumn, setSortColumn] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");

    const fetchVehicleTypes = async () => {
        try {
            const response = await getAllVehicleTypes();
            if (response.data?.data) {
                const options = response.data.data.map(type => ({
                    value: type.name,
                    label: type.name
                }));
                setTypeOptions(options);
            }
        } catch (error) {
            console.error("Error fetching vehicle types:", error);
        }
    };

    useEffect(() => {
        fetchVehicleTypes();
    }, [view]);

    const handleTypeFilterChange = (selected) => {
        setPageNo(1);
        const values = selected ? selected.map(opt => opt.value) : [];
        setSelectedType(values);
    };

    const handleStatusFilterChange = (selected) => {
        setPageNo(1);
        const values = selected ? selected.map(opt => opt.value) : [];
        setSelectedStatus(values);
    };

    const fetchVehiclesList = async () => {
        setIsPageLoading(true);
        let skip = (pageNo - 1) * perPage;
        if (skip < 0) {
            skip = 0;
        }

        try {
            const response = await searchVehicles({
                skip: skip,
                per_page: perPage,
                sorton: sortColumn,
                sortdir: sortDirection,
                match: query,
                isActive: filter,
                type: selectedType,
                status: selectedStatus,
            });

            if (response.data?.data?.length > 0) {
                const res = response.data.data[0];
                setVehicles(res.data || []);
                setTotalRows(res.count || 0);
            } else {
                setVehicles([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching vehicles list:", error);
            setVehicles([]);
            setTotalRows(0);
            toast.error("Failed to fetch vehicles list");
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        if (view === "LIST") {
            fetchVehiclesList();
        }
    }, [pageNo, perPage, sortColumn, sortDirection, query, filter, view, selectedType, selectedStatus]);

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
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size should not exceed 5MB");
                e.target.value = "";
                return;
            }
            // Check file type
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
        setValues(initialState);
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
        getVehicleById(id)
            .then((res) => {
                if (res.data?.data) {
                    const data = res.data.data;
                    setValues({
                        registration_number: data.registration_number,
                        name_model: data.name_model,
                        type: data.type,
                        max_load_capacity: data.max_load_capacity,
                        odometer: data.odometer,
                        acquisition_cost: data.acquisition_cost,
                        status: data.status,
                        region: data.region,
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
                console.error("Error fetching vehicle details:", err);
                toast.error("Failed to load vehicle details");
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
        if (!fields.registration_number.trim()) {
            errors.registration_number = "Registration number is required";
        }
        if (!fields.name_model.trim()) {
            errors.name_model = "Name / Model is required";
        }
        if (!fields.type) {
            errors.type = "Vehicle type is required";
        }
        if (fields.max_load_capacity === "" || isNaN(fields.max_load_capacity)) {
            errors.max_load_capacity = "Max load capacity is required and must be a number";
        }
        if (fields.odometer === "" || isNaN(fields.odometer)) {
            errors.odometer = "Odometer reading is required and must be a number";
        }
        if (fields.acquisition_cost === "" || isNaN(fields.acquisition_cost)) {
            errors.acquisition_cost = "Acquisition cost is required and must be a number";
        }
        if (!fields.region.trim()) {
            errors.region = "Region is required";
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

            formData.append("registration_number", values.registration_number.trim());
            formData.append("name_model", values.name_model.trim());
            formData.append("type", values.type);
            formData.append("max_load_capacity", values.max_load_capacity);
            formData.append("odometer", values.odometer);
            formData.append("acquisition_cost", values.acquisition_cost);
            formData.append("status", values.status);
            formData.append("region", values.region.trim());
            formData.append("isActive", values.isActive);

            if (selectedFile) {
                formData.append("image", selectedFile);
            }
            if (removeImageFlag) {
                formData.append("removeImage", "true");
            }

            if (view === "ADD") {
                createVehicle(formData)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Vehicle Added Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to add vehicle");
                        }
                    })
                    .catch((err) => {
                        console.error("Error creating vehicle:", err);
                        toast.error(err.response?.data?.message || "Failed to add vehicle");
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } else if (view === "EDIT") {
                updateVehicle(editId, formData)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Vehicle Updated Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to update vehicle");
                        }
                    })
                    .catch((err) => {
                        console.error("Error updating vehicle:", err);
                        toast.error(err.response?.data?.message || "Failed to update vehicle");
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
        deleteVehicle(removeId)
            .then(() => {
                setModalDelete(false);
                toast.success("Vehicle Removed Successfully!");
                fetchVehiclesList();
            })
            .catch((err) => {
                console.error("Error deleting vehicle:", err);
                toast.error("Failed to remove vehicle");
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
        // {
        //     name: "Image",
        //     selector: (row) => {
        //         if (row.image) {
        //             const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
        //             return (
        //                 <img
        //                     src={`${apiUrl}/${row.image}`}
        //                     alt="Vehicle"
        //                     style={{
        //                         width: "45px",
        //                         height: "35px",
        //                         objectFit: "cover",
        //                         borderRadius: "4px",
        //                         border: "1px solid #ddd",
        //                     }}
        //                 />
        //             );
        //         }
        //         return <span className="text-muted">No Image</span>;
        //     },
        //     maxWidth: "80px",
        // },
        {
            name: "Reg Number",
            selector: (row) => row.registration_number,
            sortable: true,
            sortField: "registration_number",
            minWidth: "120px",
        },
        {
            name: "Model / Name",
            selector: (row) => row.name_model,
            sortable: true,
            sortField: "name_model",
            minWidth: "130px",
        },
        {
            name: "Type",
            selector: (row) => row.type,
            sortable: true,
            sortField: "type",
            minWidth: "110px",
        },
        {
            name: "Max Load",
            selector: (row) => `${row.max_load_capacity} kg`,
            sortable: true,
            sortField: "max_load_capacity",
            minWidth: "100px",
        },
        {
            name: "Odometer",
            selector: (row) => `${row.odometer} km`,
            sortable: true,
            sortField: "odometer",
            minWidth: "110px",
        },
        {
            name: "Cost",
            selector: (row) => `${row.acquisition_cost}`,
            sortable: true,
            sortField: "acquisition_cost",
            minWidth: "100px",
        },
        {
            name: "Status",
            selector: (row) => {
                let badgeClass = "badge bg-info-subtle text-info";
                if (row.status === "Available") badgeClass = "badge bg-success-subtle text-success";
                else if (row.status === "On Trip") badgeClass = "badge bg-primary-subtle text-primary";
                else if (row.status === "In Shop") badgeClass = "badge bg-warning-subtle text-warning";
                else if (row.status === "Retired") badgeClass = "badge bg-danger-subtle text-danger";

                return <span className={badgeClass}>{row.status}</span>;
            },
            minWidth: "100px",
        },
        {
            name: "Region",
            selector: (row) => row.region,
            sortable: true,
            sortField: "region",
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

    document.title = `Vehicle Master | ${adminData?.companyName || "TransitOps"}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {view === "LIST" && (
                        <>
                            <BreadCrumb
                                maintitle="Master"
                                title="Vehicle"
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader>
                                            <FormsHeader
                                                formName="Vehicle"
                                                filter={filter}
                                                handleFilter={handleFilter}
                                                tog_list={handleAddClick}
                                                setQuery={setQuery}
                                                showAddButton={currentPagePermissions?.write}
                                            />
                                        </CardHeader>
                                        <CardBody>
                                            <Row className="mb-3 align-items-center">
                                                <Col md={4}>
                                                    <Label for="filter-type" className="form-label mb-1">Filter by Type</Label>
                                                    <Select
                                                        id="filter-type"
                                                        isMulti
                                                        options={typeOptions}
                                                        value={typeOptions.filter(opt => selectedType.includes(opt.value))}
                                                        onChange={handleTypeFilterChange}
                                                        placeholder="All Types"
                                                        isClearable
                                                        isDisabled={isPageLoading}
                                                    />
                                                </Col>
                                                <Col md={4}>
                                                    <Label for="filter-status" className="form-label mb-1">Filter by Status</Label>
                                                    <Select
                                                        id="filter-status"
                                                        isMulti
                                                        options={statusOptions}
                                                        value={statusOptions.filter(opt => selectedStatus.includes(opt.value))}
                                                        onChange={handleStatusFilterChange}
                                                        placeholder="All Statuses"
                                                        isClearable
                                                        isDisabled={isPageLoading}
                                                    />
                                                </Col>
                                            </Row>
                                            <div id="vehicleList">
                                                <div className="table-responsive table-card mt-1 mb-1 text-right">
                                                    <DataTable
                                                        columns={col}
                                                        data={vehicles}
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
                                title={view === "ADD" ? "Add Vehicle" : "Edit Vehicle"}
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader className="align-items-center d-flex">
                                            <h4 className="card-title mb-0 flex-grow-1">
                                                {view === "ADD" ? "Create New Vehicle" : "Update Vehicle"}
                                            </h4>
                                        </CardHeader>
                                        <CardBody>
                                            <form onSubmit={handleSubmit}>
                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="registration_number">Registration Number <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="registration_number"
                                                                id="registration_number"
                                                                placeholder="e.g. AB123CD"
                                                                value={values.registration_number}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.registration_number && (
                                                                <span className="text-danger">{formErrors.registration_number}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="name_model">Vehicle Model / Name <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="name_model"
                                                                id="name_model"
                                                                placeholder="e.g. Volvo FH16"
                                                                value={values.name_model}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.name_model && (
                                                                <span className="text-danger">{formErrors.name_model}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="type">Vehicle Type <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="type"
                                                                options={typeOptions}
                                                                value={typeOptions.find(opt => opt.value === values.type) || null}
                                                                onChange={(selected) => setValues({ ...values, type: selected ? selected.value : "" })}
                                                                placeholder="Select Type..."
                                                                isDisabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.type && (
                                                                <span className="text-danger">{formErrors.type}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="vehicle-status">Status <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="vehicle-status"
                                                                options={statusOptions}
                                                                value={statusOptions.find(opt => opt.value === values.status) || null}
                                                                onChange={(selected) => setValues({ ...values, status: selected ? selected.value : "Available" })}
                                                                placeholder="Select Status..."
                                                                isDisabled={isLoading}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={4}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="max_load_capacity">Max Load Capacity (kg) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="max_load_capacity"
                                                                id="max_load_capacity"
                                                                placeholder="e.g. 5000"
                                                                value={values.max_load_capacity}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.max_load_capacity && (
                                                                <span className="text-danger">{formErrors.max_load_capacity}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={4}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="odometer">Odometer (km) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="odometer"
                                                                id="odometer"
                                                                placeholder="e.g. 150000"
                                                                value={values.odometer}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.odometer && (
                                                                <span className="text-danger">{formErrors.odometer}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={4}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="acquisition_cost">Acquisition Cost ($) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="acquisition_cost"
                                                                id="acquisition_cost"
                                                                placeholder="e.g. 45000"
                                                                value={values.acquisition_cost}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.acquisition_cost && (
                                                                <span className="text-danger">{formErrors.acquisition_cost}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="region">Region <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="region"
                                                                id="region"
                                                                placeholder="e.g. Midwest"
                                                                value={values.region}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.region && (
                                                                <span className="text-danger">{formErrors.region}</span>
                                                            )}
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

                                                <Row className="mb-4">
                                                    <Col md={12}>
                                                        <FormGroup>
                                                            <Label>Vehicle Image</Label>
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
                                                                        alt="Vehicle Preview"
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
                                                                        title="Remove Image"
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

export default Vehicle;
