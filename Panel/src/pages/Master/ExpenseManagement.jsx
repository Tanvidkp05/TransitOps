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
    createExpense,
    deleteExpense,
    getExpenseById,
    updateExpense,
    searchExpenses,
    getVehicleCosts,
} from "../../api/expenses.api";
import { getAllVehicles } from "../../api/vehicles.api";

const initialState = {
    vehicle_id: "",
    expense_type: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    fuel_liters: "",
    odometer_reading: "",
    description: "",
    isActive: true,
};

const expenseTypeOptions = [
    { value: "Fuel", label: "Fuel" },
    { value: "Toll", label: "Toll" },
    { value: "Insurance", label: "Insurance" },
    { value: "Permit", label: "Permit" },
    { value: "Other", label: "Other" },
];

const ExpenseManagement = () => {
    const { adminData } = useContext(AuthContext);
    const { currentPagePermissions } = useContext(MenuContext);

    const [view, setView] = useState("LIST"); // "LIST", "ADD", "EDIT"
    const [activeTab, setActiveTab] = useState("EXPENSES"); // "EXPENSES", "COST_SUMMARY"
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [filter, setFilter] = useState(true);

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);

    const [expenses, setExpenses] = useState([]);
    const [vehicleCosts, setVehicleCosts] = useState([]);
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

    const fetchExpensesList = async () => {
        setIsPageLoading(true);
        let skip = (pageNo - 1) * perPage;
        if (skip < 0) {
            skip = 0;
        }

        try {
            const response = await searchExpenses({
                skip: skip,
                per_page: perPage,
                sorton: sortColumn,
                sortdir: sortDirection,
                match: query,
                isActive: filter,
            });

            if (response.data?.data?.length > 0) {
                const res = response.data.data[0];
                setExpenses(res.data || []);
                setTotalRows(res.count || 0);
            } else {
                setExpenses([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching expenses list:", error);
            setExpenses([]);
            setTotalRows(0);
            toast.error("Failed to fetch expense records");
        } finally {
            setIsPageLoading(false);
        }
    };

    const fetchCostsSummary = async () => {
        setIsPageLoading(true);
        try {
            const res = await getVehicleCosts();
            if (res.data?.isOk) {
                setVehicleCosts(res.data.data || []);
            }
        } catch (error) {
            console.error("Error loading operational costs summary:", error);
            toast.error("Failed to load operational costs summary");
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        if (view === "LIST") {
            if (activeTab === "EXPENSES") {
                fetchExpensesList();
            } else if (activeTab === "COST_SUMMARY") {
                fetchCostsSummary();
            }
        }
    }, [pageNo, perPage, sortColumn, sortDirection, query, filter, view, activeTab]);

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
            date: new Date().toISOString().split("T")[0],
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
        getExpenseById(id)
            .then((res) => {
                if (res.data?.data) {
                    const data = res.data.data;
                    setValues({
                        vehicle_id: data.vehicle_id?._id || data.vehicle_id || "",
                        expense_type: data.expense_type,
                        amount: data.amount,
                        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
                        fuel_liters: data.fuel_liters || "",
                        odometer_reading: data.odometer_reading || "",
                        description: data.description || "",
                        isActive: data.isActive,
                    });

                    if (data.receipt_image) {
                        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
                        setImagePreview(`${apiUrl}/${data.receipt_image}`);
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
                console.error("Error fetching expense details:", err);
                toast.error("Failed to load expense details");
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
        if (!fields.expense_type) {
            errors.expense_type = "Expense type is required";
        }
        if (fields.amount === "" || isNaN(fields.amount) || Number(fields.amount) <= 0) {
            errors.amount = "Amount must be a positive number";
        }
        if (!fields.date) {
            errors.date = "Date is required";
        }
        if (fields.expense_type === "Fuel") {
            if (fields.fuel_liters === "" || isNaN(fields.fuel_liters) || Number(fields.fuel_liters) <= 0) {
                errors.fuel_liters = "Fuel liters must be a positive number";
            }
            if (fields.odometer_reading === "" || isNaN(fields.odometer_reading) || Number(fields.odometer_reading) < 0) {
                errors.odometer_reading = "Odometer reading must be a positive number";
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
            const formData = new FormData();
            
            formData.append("vehicle_id", values.vehicle_id);
            formData.append("expense_type", values.expense_type);
            formData.append("amount", values.amount);
            formData.append("date", values.date);
            
            if (values.expense_type === "Fuel") {
                formData.append("fuel_liters", values.fuel_liters);
                formData.append("odometer_reading", values.odometer_reading);
            }
            
            formData.append("description", values.description.trim());
            formData.append("isActive", values.isActive);

            if (selectedFile) {
                formData.append("receipt_image", selectedFile);
            }
            if (removeImageFlag) {
                formData.append("removeImage", "true");
            }

            if (view === "ADD") {
                createExpense(formData)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Expense Logged Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to log expense");
                        }
                    })
                    .catch((err) => {
                        console.error("Error creating expense log:", err);
                        toast.error(err.response?.data?.message || "Failed to log expense");
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } else if (view === "EDIT") {
                updateExpense(editId, formData)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Expense Updated Successfully!");
                            setView("LIST");
                            setValues(initialState);
                        } else {
                            toast.error(res.data?.message || "Failed to update expense");
                        }
                    })
                    .catch((err) => {
                        console.error("Error updating expense log:", err);
                        toast.error(err.response?.data?.message || "Failed to update expense");
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
        deleteExpense(removeId)
            .then(() => {
                setModalDelete(false);
                toast.success("Expense Record Removed Successfully!");
                if (activeTab === "EXPENSES") {
                    fetchExpensesList();
                } else {
                    fetchCostsSummary();
                }
            })
            .catch((err) => {
                console.error("Error deleting expense log:", err);
                toast.error("Failed to remove expense record");
            })
            .finally(() => {
                setIsDeleteLoading(false);
            });
    };

    const vehicleSelectOptions = vehicles.map(v => ({
        value: v._id,
        label: `${v.registration_number} (${v.name_model}) - ${v.status}`
    }));

    const expenseCol = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: false,
            maxWidth: "20px",
        },
        {
            name: "Receipt",
            selector: (row) => {
                if (row.receipt_image) {
                    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
                    return (
                        <img
                            src={`${apiUrl}/${row.receipt_image}`}
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
                return <span className="text-muted">No Receipt</span>;
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
            name: "Expense Type",
            selector: (row) => {
                let badgeClass = "badge bg-info-subtle text-info";
                if (row.expense_type === "Fuel") badgeClass = "badge bg-success-subtle text-success";
                else if (row.expense_type === "Toll") badgeClass = "badge bg-primary-subtle text-primary";
                else if (row.expense_type === "Insurance") badgeClass = "badge bg-warning-subtle text-warning";
                else if (row.expense_type === "Permit") badgeClass = "badge bg-dark-subtle text-dark";

                return <span className={badgeClass}>{row.expense_type}</span>;
            },
            sortable: true,
            sortField: "expense_type",
            minWidth: "120px",
        },
        {
            name: "Amount",
            selector: (row) => `$${row.amount}`,
            sortable: true,
            sortField: "amount",
            minWidth: "90px",
        },
        {
            name: "Fuel (Liters)",
            selector: (row) => row.expense_type === "Fuel" ? `${row.fuel_liters} L` : "-",
            sortable: false,
            minWidth: "110px",
        },
        {
            name: "Odometer",
            selector: (row) => row.expense_type === "Fuel" ? `${row.odometer_reading} km` : "-",
            sortable: false,
            minWidth: "110px",
        },
        {
            name: "Date",
            selector: (row) => row.date ? new Date(row.date).toLocaleDateString() : "N/A",
            sortable: true,
            sortField: "date",
            minWidth: "110px",
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

    const costCol = [
        {
            name: "Sr No",
            selector: (row, index) => index + 1,
            sortable: false,
            maxWidth: "20px",
        },
        {
            name: "Vehicle Reg",
            selector: (row) => row.registration_number,
            sortable: true,
            minWidth: "140px",
        },
        {
            name: "Model / Name",
            selector: (row) => row.name_model,
            sortable: true,
            minWidth: "140px",
        },
        {
            name: "Fuel Costs",
            selector: (row) => `$${row.fuel_cost || 0}`,
            sortable: true,
            minWidth: "120px",
        },
        {
            name: "Maintenance Costs",
            selector: (row) => `$${row.maintenance_cost || 0}`,
            sortable: true,
            minWidth: "140px",
        },
        {
            name: "Other Costs (Tolls, etc.)",
            selector: (row) => `$${row.other_cost || 0}`,
            sortable: true,
            minWidth: "150px",
        },
        {
            name: "Total Operational Cost",
            selector: (row) => {
                return (
                    <strong className="text-success">
                        ${row.total_operational_cost || 0}
                    </strong>
                );
            },
            sortable: true,
            minWidth: "160px",
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
        }
    ];

    document.title = `Fuel & Expenses | ${adminData?.companyName || "TransitOps"}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {view === "LIST" && (
                        <>
                            <BreadCrumb
                                maintitle="Master"
                                title="Fuel & Expense Management"
                                pageTitle="Master"
                            />
                            
                            {/* Nav Tabs */}
                            <ul className="nav nav-tabs nav-tabs-custom nav-success mb-3" role="tablist">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "EXPENSES" ? "active" : ""}`}
                                        onClick={() => {
                                            setPageNo(1);
                                            setActiveTab("EXPENSES");
                                        }}
                                    >
                                        Expense Logs
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === "COST_SUMMARY" ? "active" : ""}`}
                                        onClick={() => {
                                            setActiveTab("COST_SUMMARY");
                                        }}
                                    >
                                        Vehicle Cost Summary
                                    </button>
                                </li>
                            </ul>

                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader>
                                            <FormsHeader
                                                formName={activeTab === "EXPENSES" ? "Expense Logs" : "Vehicle Operational Costs"}
                                                filter={filter}
                                                handleFilter={handleFilter}
                                                tog_list={handleAddClick}
                                                setQuery={setQuery}
                                                showAddButton={activeTab === "EXPENSES" && currentPagePermissions?.write}
                                                showSearchInput={activeTab === "EXPENSES"}
                                            />
                                        </CardHeader>
                                        <CardBody>
                                            <div className="table-responsive table-card mt-1 mb-1 text-right">
                                                {activeTab === "EXPENSES" ? (
                                                    <DataTable
                                                        columns={expenseCol}
                                                        data={expenses}
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
                                                ) : (
                                                    <DataTable
                                                        columns={costCol}
                                                        data={vehicleCosts}
                                                        progressPending={isPageLoading}
                                                        pagination
                                                        paginationPerPage={100}
                                                    />
                                                )}
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
                                title={view === "ADD" ? "Log Expense" : "Edit Expense"}
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader className="align-items-center d-flex">
                                            <h4 className="card-title mb-0 flex-grow-1">
                                                {view === "ADD" ? "Create New Expense Log" : "Update Expense Log"}
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
                                                            <Label for="expense_type_select">Expense Type <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="expense_type_select"
                                                                options={expenseTypeOptions}
                                                                value={expenseTypeOptions.find(opt => opt.value === values.expense_type) || null}
                                                                onChange={(selected) => setValues({ ...values, expense_type: selected ? selected.value : "" })}
                                                                placeholder="Select Type..."
                                                                isDisabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.expense_type && (
                                                                <span className="text-danger">{formErrors.expense_type}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="amount">Amount ($) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="amount"
                                                                id="amount"
                                                                placeholder="e.g. 150"
                                                                value={values.amount}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.amount && (
                                                                <span className="text-danger">{formErrors.amount}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="date">Date <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="date"
                                                                name="date"
                                                                id="date"
                                                                value={values.date}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.date && (
                                                                <span className="text-danger">{formErrors.date}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                {values.expense_type === "Fuel" && (
                                                    <Row>
                                                        <Col md={6}>
                                                            <FormGroup className="mb-3">
                                                                <Label for="fuel_liters">Fuel Liters <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    type="number"
                                                                    name="fuel_liters"
                                                                    id="fuel_liters"
                                                                    placeholder="e.g. 50"
                                                                    value={values.fuel_liters}
                                                                    onChange={handleChange}
                                                                    disabled={isLoading}
                                                                />
                                                                {isSubmit && formErrors.fuel_liters && (
                                                                    <span className="text-danger">{formErrors.fuel_liters}</span>
                                                                )}
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup className="mb-3">
                                                                <Label for="odometer_reading">Odometer Reading (km) <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    type="number"
                                                                    name="odometer_reading"
                                                                    id="odometer_reading"
                                                                    placeholder="e.g. 125000"
                                                                    value={values.odometer_reading}
                                                                    onChange={handleChange}
                                                                    disabled={isLoading}
                                                                />
                                                                {isSubmit && formErrors.odometer_reading && (
                                                                    <span className="text-danger">{formErrors.odometer_reading}</span>
                                                                )}
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                )}

                                                <Row>
                                                    <Col md={12}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="description">Detailed Description</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="description"
                                                                id="description"
                                                                rows="3"
                                                                placeholder="Receipt references, toll locations, or details..."
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
                                                            <Label>Receipt Attachment</Label>
                                                            {showFileInput ? (
                                                                <input
                                                                    type="file"
                                                                    name="receipt_image"
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
                                                                        title="Remove Receipt"
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

export default ExpenseManagement;
