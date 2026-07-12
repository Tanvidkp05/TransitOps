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
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
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
    createTrip,
    deleteTrip,
    getTripById,
    updateTrip,
    searchTrips,
    dispatchTrip,
    completeTrip,
    cancelTrip,
} from "../../api/trips.api";
import { searchVehicles } from "../../api/vehicles.api";
import { searchDrivers } from "../../api/drivers.api";

const initialState = {
    source: "",
    destination: "",
    vehicle_id: "",
    driver_id: "",
    cargo_weight: "",
    planned_distance: "",
    notes: "",
};

const statusOptions = [
    { value: "Draft", label: "Draft" },
    { value: "Dispatched", label: "Dispatched" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
];

const getStepStyle = (stepName, currentStatus) => {
    const activeColor = "#0ab39c"; // teal
    const cancelColor = "#f06548"; // red
    const inactiveColor = "#e9ebec";
    const inactiveTextColor = "#adb5bd";

    if (currentStatus === "Cancelled") {
        if (stepName === "Draft") return { circleBg: activeColor, textClass: "text-success fw-semibold" };
        if (stepName === "Cancelled") return { circleBg: cancelColor, textClass: "text-danger fw-semibold" };
        return { circleBg: inactiveColor, textClass: "text-muted" };
    }

    const order = ["Draft", "Dispatched", "Completed"];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepName);

    if (stepName === "Cancelled") {
        return { circleBg: inactiveColor, textClass: "text-muted" };
    }

    if (stepIndex <= currentIndex && currentIndex !== -1) {
        return { circleBg: activeColor, textClass: "text-success fw-semibold" };
    }

    return { circleBg: inactiveColor, textClass: "text-muted" };
};

const getLineWidth = (currentStatus) => {
    if (currentStatus === "Draft") return "0%";
    if (currentStatus === "Dispatched") return "33%";
    if (currentStatus === "Completed") return "66%";
    if (currentStatus === "Cancelled") return "100%";
    return "0%";
};

const getLineColor = (currentStatus) => {
    if (currentStatus === "Cancelled") return "#f06548"; // red
    return "#0ab39c"; // teal
};

const TripManagement = () => {
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

    // Lists for dropdown selection
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);

    // Data lists
    const [trips, setTrips] = useState([]);
    const [query, setQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    
    // Modal states
    const [editId, setEditId] = useState("");
    const [removeId, setRemoveId] = useState("");
    const [actionId, setActionId] = useState("");
    const [selectedTripDetails, setSelectedTripDetails] = useState(null);

    const [modalDelete, setModalDelete] = useState(false);
    const [modalDispatch, setModalDispatch] = useState(false);
    const [modalComplete, setModalComplete] = useState(false);
    const [modalCancel, setModalCancel] = useState(false);
    const [modalView, setModalView] = useState(false);

    // Complete / Cancel fields
    const [finalOdometer, setFinalOdometer] = useState("");
    const [fuelConsumed, setFuelConsumed] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");

    // Odometer context check
    const [currentVehicleOdometer, setCurrentVehicleOdometer] = useState(0);
    const [maxCapacityWarning, setMaxCapacityWarning] = useState("");
    const [cargoWeightExceeded, setCargoWeightExceeded] = useState(false);
    const [selectedVehicleCapacity, setSelectedVehicleCapacity] = useState(0);
    const [enteredCargoWeight, setEnteredCargoWeight] = useState(0);

    // Datatable states
    const [totalRows, setTotalRows] = useState(0);
    const [perPage, setPerPage] = useState(100);
    const [pageNo, setPageNo] = useState(1);
    const [sortColumn, setSortColumn] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState("desc");

    // Fetch lists
    const fetchAvailableAssets = async (currentVehicle = null, currentDriver = null) => {
        try {
            // Fetch Available Vehicles
            const vehicleRes = await searchVehicles({ status: "Available", per_page: 500, isActive: true });
            let vList = [];
            if (vehicleRes.data?.data?.length > 0) {
                vList = vehicleRes.data.data[0].data.map(v => ({
                    value: v._id,
                    label: `${v.registration_number} - ${v.name_model} (Capacity: ${v.max_load_capacity} kg)`,
                    max_load_capacity: v.max_load_capacity,
                    odometer: v.odometer,
                }));
            }
            // Append current vehicle if editing
            if (currentVehicle && !vList.some(v => v.value === currentVehicle._id)) {
                vList.push({
                    value: currentVehicle._id,
                    label: `${currentVehicle.registration_number} - ${currentVehicle.name_model} [Currently Assigned]`,
                    max_load_capacity: currentVehicle.max_load_capacity,
                    odometer: currentVehicle.odometer,
                });
            }
            setAvailableVehicles(vList);

            // Fetch Available Drivers
            const driverRes = await searchDrivers({ status: "Available", per_page: 500, isActive: true });
            let dList = [];
            if (driverRes.data?.data?.length > 0) {
                dList = driverRes.data.data[0].data.map(d => ({
                    value: d._id,
                    label: `${d.name} (${d.licenseCategory})`,
                    licenseCategory: d.licenseCategory,
                }));
            }
            // Append current driver if editing
            if (currentDriver && !dList.some(d => d.value === currentDriver._id)) {
                dList.push({
                    value: currentDriver._id,
                    label: `${currentDriver.name} (${currentDriver.licenseCategory}) [Currently Assigned]`,
                    licenseCategory: currentDriver.licenseCategory,
                });
            }
            setAvailableDrivers(dList);
        } catch (error) {
            console.error("Error fetching available vehicles or drivers:", error);
            toast.error("Failed to load available vehicles or drivers");
        }
    };

    const fetchTripsList = async () => {
        setIsPageLoading(true);
        let skip = (pageNo - 1) * perPage;
        if (skip < 0) skip = 0;

        try {
            const response = await searchTrips({
                skip: skip,
                per_page: perPage,
                sorton: sortColumn,
                sortdir: sortDirection,
                match: query,
                status: selectedStatus || undefined,
                isActive: filter,
            });

            if (response.data?.data?.length > 0) {
                const res = response.data.data[0];
                setTrips(res.data || []);
                setTotalRows(res.count || 0);
            } else {
                setTrips([]);
                setTotalRows(0);
            }
        } catch (error) {
            console.error("Error fetching trips list:", error);
            setTrips([]);
            setTotalRows(0);
            toast.error("Failed to fetch trips list");
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        if (view === "LIST") {
            fetchTripsList();
        }
    }, [pageNo, perPage, sortColumn, sortDirection, query, filter, view, selectedStatus]);

    // Track cargo weight limits
    useEffect(() => {
        if (values.vehicle_id && values.cargo_weight) {
            const selectedVehicle = availableVehicles.find(v => v.value === values.vehicle_id);
            if (selectedVehicle) {
                const capacity = Number(selectedVehicle.max_load_capacity);
                const cargo = Number(values.cargo_weight);
                setSelectedVehicleCapacity(capacity);
                setEnteredCargoWeight(cargo);
                if (cargo > capacity) {
                    setCargoWeightExceeded(true);
                    setMaxCapacityWarning(`Warning: Cargo weight exceeds vehicle's maximum load capacity (${capacity} kg)`);
                } else {
                    setCargoWeightExceeded(false);
                    setMaxCapacityWarning("");
                }
            } else {
                setCargoWeightExceeded(false);
                setMaxCapacityWarning("");
            }
        } else {
            setCargoWeightExceeded(false);
            setMaxCapacityWarning("");
        }
    }, [values.vehicle_id, values.cargo_weight, availableVehicles]);

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
        fetchAvailableAssets();
        setView("ADD");
    };

    const handleEditClick = (id) => {
        setEditId(id);
        setIsLoading(true);
        getTripById(id)
            .then(async (res) => {
                if (res.data?.data) {
                    const data = res.data.data;
                    if (data.status !== "Draft") {
                        toast.error("Only Draft trips can be modified");
                        return;
                    }
                    
                    // Fetch available options including currently assigned asset items
                    await fetchAvailableAssets(data.vehicle_id, data.driver_id);

                    setValues({
                        source: data.source,
                        destination: data.destination,
                        vehicle_id: data.vehicle_id?._id || "",
                        driver_id: data.driver_id?._id || "",
                        cargo_weight: data.cargo_weight,
                        planned_distance: data.planned_distance,
                        notes: data.notes || "",
                    });
                    setFormErrors({});
                    setIsSubmit(false);
                    setView("EDIT");
                }
            })
            .catch((err) => {
                console.error("Error loading trip data:", err);
                toast.error("Failed to load trip details");
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

    const validate = (fields) => {
        const errors = {};
        if (!fields.source.trim()) errors.source = "Source location is required";
        if (!fields.destination.trim()) errors.destination = "Destination location is required";
        if (!fields.vehicle_id) errors.vehicle_id = "Vehicle assignment is required";
        if (!fields.driver_id) errors.driver_id = "Driver assignment is required";
        
        if (!fields.cargo_weight || isNaN(fields.cargo_weight) || Number(fields.cargo_weight) <= 0) {
            errors.cargo_weight = "Cargo weight must be a positive number";
        } else if (fields.vehicle_id) {
            const vehicle = availableVehicles.find(v => v.value === fields.vehicle_id);
            if (vehicle && Number(fields.cargo_weight) > vehicle.max_load_capacity) {
                errors.cargo_weight = `Cargo weight exceeds vehicle's max capacity (${vehicle.max_load_capacity} kg)`;
            }
        }

        if (!fields.planned_distance || isNaN(fields.planned_distance) || Number(fields.planned_distance) <= 0) {
            errors.planned_distance = "Planned distance must be a positive number";
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
                cargo_weight: Number(values.cargo_weight),
                planned_distance: Number(values.planned_distance),
            };

            if (view === "ADD") {
                createTrip(payload)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Trip Draft Created successfully");
                            setView("LIST");
                        } else {
                            toast.error(res.data?.message || "Failed to create trip draft");
                        }
                    })
                    .catch((err) => {
                        console.error("Error creating trip:", err);
                        toast.error(err.response?.data?.message || "Failed to create trip draft");
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } else if (view === "EDIT") {
                updateTrip(editId, payload)
                    .then((res) => {
                        if (res.data?.isOk) {
                            toast.success("Trip updated successfully");
                            setView("LIST");
                        } else {
                            toast.error(res.data?.message || "Failed to update trip");
                        }
                    })
                    .catch((err) => {
                        console.error("Error updating trip:", err);
                        toast.error(err.response?.data?.message || "Failed to update trip");
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
        deleteTrip(removeId)
            .then(() => {
                setModalDelete(false);
                toast.success("Trip removed successfully");
                fetchTripsList();
            })
            .catch((err) => {
                console.error("Error deleting trip:", err);
                toast.error(err.response?.data?.message || "Failed to delete trip");
            })
            .finally(() => {
                setIsDeleteLoading(false);
            });
    };

    // View Details Modal
    const handleViewDetails = (id) => {
        getTripById(id)
            .then((res) => {
                if (res.data?.data) {
                    setSelectedTripDetails(res.data.data);
                    setModalView(true);
                }
            })
            .catch((err) => {
                console.error("Error fetching details:", err);
                toast.error("Failed to fetch details");
            });
    };

    // Dispatch Modal Flow
    const handleDispatchClick = (id) => {
        setActionId(id);
        getTripById(id)
            .then((res) => {
                if (res.data?.data) {
                    setSelectedTripDetails(res.data.data);
                    setModalDispatch(true);
                }
            })
            .catch((err) => {
                console.error("Error loading trip details:", err);
                toast.error("Failed to load details");
            });
    };

    const confirmDispatch = () => {
        setIsLoading(true);
        dispatchTrip(actionId)
            .then(() => {
                setModalDispatch(false);
                toast.success("Trip dispatched successfully! Vehicle and driver are now On Trip.");
                fetchTripsList();
            })
            .catch((err) => {
                console.error("Error dispatching trip:", err);
                toast.error(err.response?.data?.message || "Failed to dispatch trip");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Complete Modal Flow
    const handleCompleteClick = (id) => {
        setActionId(id);
        getTripById(id)
            .then((res) => {
                if (res.data?.data) {
                    const data = res.data.data;
                    setSelectedTripDetails(data);
                    setCurrentVehicleOdometer(data.vehicle_id?.odometer || 0);
                    setFinalOdometer("");
                    setFuelConsumed("");
                    setModalComplete(true);
                }
            })
            .catch((err) => {
                console.error("Error fetching trip details for completion:", err);
                toast.error("Failed to load trip details");
            });
    };

    const confirmComplete = (e) => {
        e.preventDefault();
        if (!finalOdometer || isNaN(finalOdometer) || Number(finalOdometer) <= currentVehicleOdometer) {
            toast.error(`Final odometer must be a number greater than the current vehicle odometer (${currentVehicleOdometer} km)`);
            return;
        }

        setIsLoading(true);
        const payload = {
            final_odometer: Number(finalOdometer),
            fuel_consumed: fuelConsumed ? Number(fuelConsumed) : undefined,
        };

        completeTrip(actionId, payload)
            .then(() => {
                setModalComplete(false);
                toast.success("Trip completed! Vehicle odometer updated, assets marked Available.");
                fetchTripsList();
            })
            .catch((err) => {
                console.error("Error completing trip:", err);
                toast.error(err.response?.data?.message || "Failed to complete trip");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Cancel Modal Flow
    const handleCancelClickAction = (id) => {
        setActionId(id);
        getTripById(id)
            .then((res) => {
                if (res.data?.data) {
                    setSelectedTripDetails(res.data.data);
                    setCancellationReason("");
                    setModalCancel(true);
                }
            })
            .catch((err) => {
                console.error("Error fetching details:", err);
                toast.error("Failed to load details");
            });
    };

    const confirmCancel = (e) => {
        e.preventDefault();
        setIsLoading(true);
        cancelTrip(actionId, { cancellation_reason: cancellationReason })
            .then(() => {
                setModalCancel(false);
                toast.success("Trip cancelled successfully");
                fetchTripsList();
            })
            .catch((err) => {
                console.error("Error cancelling trip:", err);
                toast.error(err.response?.data?.message || "Failed to cancel trip");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const col = [
        {
            name: "Trip #",
            selector: (row) => row.trip_number,
            sortable: true,
            sortField: "trip_number",
            minWidth: "140px",
        },
        {
            name: "Route",
            selector: (row) => `${row.source} ➔ ${row.destination}`,
            sortable: false,
            minWidth: "180px",
        },
        {
            name: "Vehicle",
            selector: (row) => row.vehicle_id ? `${row.vehicle_id.registration_number} (${row.vehicle_id.name_model})` : "N/A",
            sortable: true,
            sortField: "vehicle_id",
            minWidth: "160px",
        },
        {
            name: "Driver",
            selector: (row) => row.driver_id ? row.driver_id.name : "N/A",
            sortable: true,
            sortField: "driver_id",
            minWidth: "140px",
        },
        {
            name: "Cargo (kg)",
            selector: (row) => row.cargo_weight,
            sortable: true,
            sortField: "cargo_weight",
            maxWidth: "110px",
        },
        {
            name: "Distance (km)",
            selector: (row) => row.planned_distance,
            sortable: true,
            sortField: "planned_distance",
            maxWidth: "120px",
        },
        {
            name: "Status",
            selector: (row) => {
                let badgeClass = "badge bg-secondary-subtle text-secondary";
                if (row.status === "Dispatched") badgeClass = "badge bg-primary-subtle text-primary";
                else if (row.status === "Completed") badgeClass = "badge bg-success-subtle text-success";
                else if (row.status === "Cancelled") badgeClass = "badge bg-danger-subtle text-danger";

                return <span className={badgeClass}>{row.status}</span>;
            },
            maxWidth: "110px",
        },
        {
            name: "Actions",
            selector: (row) => {
                return (
                    <div className="d-flex gap-1 flex-wrap py-1">
                        {/* Always show View details */}
                        <Button color="light" size="sm" onClick={() => handleViewDetails(row._id)}>
                            View
                        </Button>

                        {row.status === "Draft" && (
                            <>
                                {currentPagePermissions?.edit && (
                                    <Button color="success" size="sm" onClick={() => handleEditClick(row._id)}>
                                        Edit
                                    </Button>
                                )}
                                {currentPagePermissions?.write && (
                                    <Button color="primary" size="sm" onClick={() => handleDispatchClick(row._id)}>
                                        Dispatch
                                    </Button>
                                )}
                                {currentPagePermissions?.edit && (
                                    <Button color="warning" size="sm" onClick={() => handleCancelClickAction(row._id)}>
                                        Cancel
                                    </Button>
                                )}
                                {currentPagePermissions?.delete && (
                                    <Button color="danger" size="sm" onClick={() => handleDeleteClick(row._id)}>
                                        Delete
                                    </Button>
                                )}
                            </>
                        )}

                        {row.status === "Dispatched" && (
                            <>
                                {currentPagePermissions?.write && (
                                    <Button color="success" size="sm" onClick={() => handleCompleteClick(row._id)}>
                                        Complete
                                    </Button>
                                )}
                                {currentPagePermissions?.edit && (
                                    <Button color="warning" size="sm" onClick={() => handleCancelClickAction(row._id)}>
                                        Cancel
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                );
            },
            sortable: false,
            minWidth: "220px",
        },
    ];

    document.title = `Trip Management | ${adminData?.companyName || "TransitOps"}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    {view === "LIST" && (
                        <>
                            <BreadCrumb
                                maintitle="Master"
                                title="Trip"
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader>
                                            <FormsHeader
                                                formName="Trip Management"
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
                                                    <Label for="filter-status" className="form-label mb-1">Filter by Status</Label>
                                                    <Select
                                                        id="filter-status"
                                                        options={[
                                                            { value: "", label: "All Statuses" },
                                                            ...statusOptions
                                                        ]}
                                                        value={statusOptions.find(opt => opt.value === selectedStatus) || { value: "", label: "All Statuses" }}
                                                        onChange={(selected) => {
                                                            setPageNo(1);
                                                            setSelectedStatus(selected ? selected.value : "");
                                                        }}
                                                        placeholder="Filter by Status"
                                                        isDisabled={isPageLoading}
                                                    />
                                                </Col>
                                            </Row>
                                            <div id="tripList">
                                                <div className="table-responsive table-card mt-1 mb-1 text-right">
                                                    <DataTable
                                                        columns={col}
                                                        data={trips}
                                                        progressPending={isPageLoading}
                                                        sortServer
                                                        onSort={handleSort}
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
                                title={view === "ADD" ? "Add Trip" : "Edit Trip"}
                                pageTitle="Master"
                            />
                            <Row>
                                <Col lg={12}>
                                    <Card>
                                        <CardHeader className="align-items-center d-flex">
                                            <h4 className="card-title mb-0 flex-grow-1">
                                                {view === "ADD" ? "Create New Trip Draft" : "Update Trip Draft"}
                                            </h4>
                                        </CardHeader>
                                        <CardBody>
                                            {/* Trip Lifecycle Step Progress Bar */}
                                            <div className="mb-4 bg-light p-3 rounded">
                                                <Label className="form-label text-muted text-uppercase fs-11 fw-semibold mb-3">Trip Lifecycle</Label>
                                                <div className="d-flex align-items-center justify-content-between position-relative px-4 mb-2" style={{ maxWidth: "600px" }}>
                                                    {/* Background Line */}
                                                    <div className="position-absolute" style={{ top: "12px", left: "40px", right: "40px", height: "3px", backgroundColor: "#e9ebec", zIndex: 1 }}>
                                                        <div style={{
                                                            height: "100%",
                                                            width: "0%",
                                                            backgroundColor: "#0ab39c",
                                                            transition: "width 0.3s ease"
                                                        }}></div>
                                                    </div>
                                                    
                                                    {/* Step 1: Draft */}
                                                    <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px", backgroundColor: "#0ab39c", color: "white" }}>
                                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "white" }}></div>
                                                        </div>
                                                        <span className="mt-1 fs-12 fw-semibold text-success">Draft</span>
                                                    </div>

                                                    {/* Step 2: Dispatched */}
                                                    <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px", backgroundColor: "#e9ebec", color: "#adb5bd" }}>
                                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#adb5bd" }}></div>
                                                        </div>
                                                        <span className="mt-1 fs-12 text-muted">Dispatched</span>
                                                    </div>

                                                    {/* Step 3: Completed */}
                                                    <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px", backgroundColor: "#e9ebec", color: "#adb5bd" }}>
                                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#adb5bd" }}></div>
                                                        </div>
                                                        <span className="mt-1 fs-12 text-muted">Completed</span>
                                                    </div>

                                                    {/* Step 4: Cancelled */}
                                                    <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "24px", height: "24px", backgroundColor: "#e9ebec", color: "#adb5bd" }}>
                                                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#adb5bd" }}></div>
                                                        </div>
                                                        <span className="mt-1 fs-12 text-muted">Cancelled</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <form onSubmit={handleSubmit}>
                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="source">SOURCE <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="source"
                                                                id="source"
                                                                placeholder="e.g. Warehouse A, New York"
                                                                value={values.source}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.source && (
                                                                <span className="text-danger">{formErrors.source}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="destination">DESTINATION <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="text"
                                                                name="destination"
                                                                id="destination"
                                                                placeholder="e.g. Port Authority, New Jersey"
                                                                value={values.destination}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.destination && (
                                                                <span className="text-danger">{formErrors.destination}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="vehicle_id">VEHICLE (AVAILABLE ONLY) <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="vehicle_id"
                                                                options={availableVehicles}
                                                                value={availableVehicles.find(opt => opt.value === values.vehicle_id) || null}
                                                                onChange={(selected) => setValues({ ...values, vehicle_id: selected ? selected.value : "" })}
                                                                placeholder="Select Available Vehicle..."
                                                                isDisabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.vehicle_id && (
                                                                <span className="text-danger">{formErrors.vehicle_id}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="driver_id">DRIVER (AVAILABLE ONLY) <span className="text-danger">*</span></Label>
                                                            <Select
                                                                id="driver_id"
                                                                options={availableDrivers}
                                                                value={availableDrivers.find(opt => opt.value === values.driver_id) || null}
                                                                onChange={(selected) => setValues({ ...values, driver_id: selected ? selected.value : "" })}
                                                                placeholder="Select Available Driver..."
                                                                isDisabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.driver_id && (
                                                                <span className="text-danger">{formErrors.driver_id}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="cargo_weight">CARGO WEIGHT (KG) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="cargo_weight"
                                                                id="cargo_weight"
                                                                placeholder="e.g. 450"
                                                                value={values.cargo_weight}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.cargo_weight && (
                                                                <span className="text-danger">{formErrors.cargo_weight}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="planned_distance">PLANNED DISTANCE (KM) <span className="text-danger">*</span></Label>
                                                            <Input
                                                                type="number"
                                                                name="planned_distance"
                                                                id="planned_distance"
                                                                placeholder="e.g. 150"
                                                                value={values.planned_distance}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                            {isSubmit && formErrors.planned_distance && (
                                                                <span className="text-danger">{formErrors.planned_distance}</span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={12}>
                                                        <FormGroup className="mb-3">
                                                            <Label for="notes">NOTES / INSTRUCTIONS</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="notes"
                                                                id="notes"
                                                                rows="3"
                                                                placeholder="Enter notes here..."
                                                                value={values.notes}
                                                                onChange={handleChange}
                                                                disabled={isLoading}
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>

                                                {/* Capacity exceeded warning box from mock design */}
                                                {cargoWeightExceeded && (
                                                    <div className="p-3 mb-4 rounded border" style={{ borderColor: "#f87171", backgroundColor: "rgba(248, 113, 113, 0.08)", color: "#f87171" }}>
                                                        <div className="fw-semibold mb-1" style={{ fontSize: "14px" }}>Vehicle Capacity: {selectedVehicleCapacity} kg</div>
                                                        <div className="fw-semibold mb-2" style={{ fontSize: "14px" }}>Cargo Weight: {enteredCargoWeight} kg</div>
                                                        <div className="fw-bold d-flex align-items-center text-danger" style={{ fontSize: "14px" }}>
                                                            <span className="me-2">❌</span>
                                                            Capacity exceeded by {enteredCargoWeight - selectedVehicleCapacity} kg — dispatch blocked
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-start gap-2 mt-4">
                                                    <Button
                                                        color={cargoWeightExceeded ? "dark" : "success"}
                                                        type="submit"
                                                        disabled={isLoading || cargoWeightExceeded}
                                                        style={{
                                                            cursor: cargoWeightExceeded ? "not-allowed" : "pointer"
                                                        }}
                                                    >
                                                        {isLoading ? "Saving..." : (cargoWeightExceeded ? "Dispatch (disabled)" : (view === "ADD" ? "Dispatch" : "Update"))}
                                                    </Button>
                                                    <Button
                                                        color="light"
                                                        type="button"
                                                        onClick={handleCancelClick}
                                                        disabled={isLoading}
                                                    >
                                                        Cancel
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

            {/* Standard Delete Modal */}
            <DeleteModal
                show={modalDelete}
                onDeleteClick={confirmDelete}
                onCloseClick={() => setModalDelete(false)}
                isLoading={isDeleteLoading}
            />

            {/* Dispatch Confirmation Modal */}
            <Modal isOpen={modalDispatch} toggle={() => setModalDispatch(false)} centered>
                <ModalHeader toggle={() => setModalDispatch(false)}>Confirm Dispatch</ModalHeader>
                <ModalBody>
                    {selectedTripDetails && (
                        <div>
                            <p>Are you sure you want to dispatch this trip?</p>
                            <div className="bg-light p-3 rounded">
                                <strong>Trip Number:</strong> {selectedTripDetails.trip_number} <br />
                                <strong>Route:</strong> {selectedTripDetails.source} ➔ {selectedTripDetails.destination} <br />
                                <strong>Vehicle:</strong> {selectedTripDetails.vehicle_id?.registration_number} ({selectedTripDetails.vehicle_id?.name_model}) <br />
                                <strong>Driver:</strong> {selectedTripDetails.driver_id?.name} <br />
                                <strong>Cargo Weight:</strong> {selectedTripDetails.cargo_weight} kg
                            </div>
                            <p className="text-danger mt-3 mb-0">
                                <i className="ri-alert-line me-1"></i>
                                Dispatching will mark both Vehicle and Driver as <strong>On Trip</strong>.
                            </p>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setModalDispatch(false)} disabled={isLoading}>Cancel</Button>
                    <Button color="primary" onClick={confirmDispatch} disabled={isLoading}>
                        {isLoading ? "Dispatching..." : "Yes, Dispatch"}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Complete Trip Modal */}
            <Modal isOpen={modalComplete} toggle={() => setModalComplete(false)} centered>
                <form onSubmit={confirmComplete}>
                    <ModalHeader toggle={() => setModalComplete(false)}>Complete Trip</ModalHeader>
                    <ModalBody>
                        {selectedTripDetails && (
                            <div>
                                <div className="bg-light p-3 rounded mb-3">
                                    <strong>Trip:</strong> {selectedTripDetails.trip_number} ({selectedTripDetails.source} ➔ {selectedTripDetails.destination}) <br />
                                    <strong>Vehicle:</strong> {selectedTripDetails.vehicle_id?.registration_number} <br />
                                    <strong>Current Vehicle Odometer:</strong> {currentVehicleOdometer} km
                                </div>
                                <FormGroup className="mb-3">
                                     <Label for="final_odometer">Final Odometer Reading (km) <span className="text-danger">*</span></Label>
                                     <input
                                         type="number"
                                         className="form-control"
                                         id="final_odometer"
                                         placeholder={`Must be greater than ${currentVehicleOdometer}`}
                                         value={finalOdometer}
                                         onChange={(e) => setFinalOdometer(e.target.value)}
                                         required
                                         disabled={isLoading}
                                         min={currentVehicleOdometer + 1}
                                     />
                                     {finalOdometer && Number(finalOdometer) <= currentVehicleOdometer && (
                                         <div className="text-danger mt-1 fw-medium" style={{ fontSize: "12px" }}>
                                             <i className="ri-error-warning-fill me-1"></i>
                                             Value must be greater than or equal to {currentVehicleOdometer + 1}.
                                         </div>
                                     )}
                                 </FormGroup>
                                 <FormGroup className="mb-0">
                                     <Label for="fuel_consumed">Fuel Consumed (Liters)</Label>
                                     <input
                                         type="number"
                                         className="form-control"
                                         id="fuel_consumed"
                                         placeholder="e.g. 45"
                                         value={fuelConsumed}
                                         onChange={(e) => setFuelConsumed(e.target.value)}
                                         disabled={isLoading}
                                         min="0.1"
                                         step="0.1"
                                     />
                                 </FormGroup>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" type="button" onClick={() => setModalComplete(false)} disabled={isLoading}>Cancel</Button>
                        <Button color="success" type="submit" disabled={isLoading}>
                            {isLoading ? "Completing..." : "Complete Trip"}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Cancel Trip Modal */}
            <Modal isOpen={modalCancel} toggle={() => setModalCancel(false)} centered>
                <form onSubmit={confirmCancel}>
                    <ModalHeader toggle={() => setModalCancel(false)}>Cancel Trip</ModalHeader>
                    <ModalBody>
                        {selectedTripDetails && (
                            <div>
                                <p>Are you sure you want to cancel trip <strong>{selectedTripDetails.trip_number}</strong>?</p>
                                {selectedTripDetails.status === "Dispatched" && (
                                    <p className="text-warning">
                                        <i className="ri-error-warning-line me-1"></i>
                                        Cancelling a dispatched trip will release the vehicle and driver back to <strong>Available</strong>.
                                    </p>
                                )}
                                <FormGroup className="mb-0">
                                    <Label for="cancellation_reason">Reason for Cancellation</Label>
                                    <Input
                                        type="textarea"
                                        id="cancellation_reason"
                                        rows="3"
                                        placeholder="Explain why the trip is being cancelled..."
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </FormGroup>
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" type="button" onClick={() => setModalCancel(false)} disabled={isLoading}>Back</Button>
                        <Button color="warning" type="submit" disabled={isLoading}>
                            {isLoading ? "Cancelling..." : "Cancel Trip"}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={modalView} toggle={() => setModalView(false)} size="lg" centered>
                <ModalHeader toggle={() => setModalView(false)} className="bg-light py-2 px-3">
                    <span className="fs-15 fw-bold">Trip Details — {selectedTripDetails?.trip_number}</span>
                </ModalHeader>
                <ModalBody className="p-3">
                    {selectedTripDetails && (
                        <div>
                            {/* Trip Lifecycle Step Progress Bar */}
                            <div className="mb-3 bg-light p-2 rounded">
                                <Label className="form-label text-muted text-uppercase fs-10 fw-semibold mb-2">Trip Lifecycle</Label>
                                <div className="d-flex align-items-center justify-content-between position-relative px-3 mb-1" style={{ maxWidth: "600px" }}>
                                    {/* Background Line */}
                                    <div className="position-absolute" style={{ top: "12px", left: "30px", right: "30px", height: "3px", backgroundColor: "#e9ebec", zIndex: 1 }}>
                                        <div style={{
                                            height: "100%",
                                            width: getLineWidth(selectedTripDetails.status),
                                            backgroundColor: getLineColor(selectedTripDetails.status),
                                            transition: "width 0.3s ease"
                                        }}></div>
                                    </div>
                                    
                                    {/* Step 1: Draft */}
                                    {(() => {
                                        const style = getStepStyle("Draft", selectedTripDetails.status);
                                        return (
                                            <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "22px", height: "22px", backgroundColor: style.circleBg, color: "white" }}>
                                                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "white" }}></div>
                                                </div>
                                                <span className={`mt-1 fs-11 ${style.textClass}`}>Draft</span>
                                            </div>
                                        );
                                    })()}

                                    {/* Step 2: Dispatched */}
                                    {(() => {
                                        const style = getStepStyle("Dispatched", selectedTripDetails.status);
                                        const isActive = style.circleBg !== "#e9ebec";
                                        return (
                                            <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "22px", height: "22px", backgroundColor: style.circleBg, color: "white" }}>
                                                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isActive ? "white" : "#adb5bd" }}></div>
                                                </div>
                                                <span className={`mt-1 fs-11 ${style.textClass}`}>Dispatched</span>
                                            </div>
                                        );
                                    })()}

                                    {/* Step 3: Completed */}
                                    {(() => {
                                        const style = getStepStyle("Completed", selectedTripDetails.status);
                                        const isActive = style.circleBg !== "#e9ebec";
                                        return (
                                            <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "22px", height: "22px", backgroundColor: style.circleBg, color: "white" }}>
                                                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isActive ? "white" : "#adb5bd" }}></div>
                                                </div>
                                                <span className={`mt-1 fs-11 ${style.textClass}`}>Completed</span>
                                            </div>
                                        );
                                    })()}

                                    {/* Step 4: Cancelled */}
                                    {(() => {
                                        const style = getStepStyle("Cancelled", selectedTripDetails.status);
                                        const isActive = style.circleBg !== "#e9ebec";
                                        return (
                                            <div className="d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
                                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: "22px", height: "22px", backgroundColor: style.circleBg, color: "white" }}>
                                                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isActive ? "white" : "#adb5bd" }}></div>
                                                </div>
                                                <span className={`mt-1 fs-11 ${style.textClass}`}>Cancelled</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Cards Section */}
                            <Row>
                                <Col md={6} className="mb-2">
                                    <div className="card border-0 bg-light-subtle h-100 p-2 rounded border mb-0">
                                        <h5 className="fs-12 text-primary text-uppercase mb-2">
                                            <i className="ri-road-map-line align-middle me-1"></i> Route & Cargo Details
                                        </h5>
                                        <ul className="list-unstyled mb-0" style={{ fontSize: "13px" }}>
                                            <li className="mb-1"><strong>Source:</strong> {selectedTripDetails.source}</li>
                                            <li className="mb-1"><strong>Destination:</strong> {selectedTripDetails.destination}</li>
                                            <li className="mb-1"><strong>Planned Distance:</strong> {selectedTripDetails.planned_distance} km</li>
                                            <li className="mb-0"><strong>Cargo Weight:</strong> {selectedTripDetails.cargo_weight} kg</li>
                                        </ul>
                                    </div>
                                </Col>
                                <Col md={6} className="mb-2">
                                    <div className="card border-0 bg-light-subtle h-100 p-2 rounded border mb-0">
                                        <h5 className="fs-12 text-primary text-uppercase mb-2">
                                            <i className="ri-user-shared-line align-middle me-1"></i> Asset Assignment
                                        </h5>
                                        <ul className="list-unstyled mb-0" style={{ fontSize: "13px" }}>
                                            <li className="mb-1">
                                                <strong>Vehicle:</strong> {selectedTripDetails.vehicle_id ? (
                                                    <span>{selectedTripDetails.vehicle_id.registration_number} ({selectedTripDetails.vehicle_id.name_model})</span>
                                                ) : "N/A"}
                                            </li>
                                            <li className="mb-1">
                                                <strong>Driver:</strong> {selectedTripDetails.driver_id ? (
                                                    <span>{selectedTripDetails.driver_id.name} ({selectedTripDetails.driver_id.licenseCategory})</span>
                                                ) : "N/A"}
                                            </li>
                                            <li className="mb-0">
                                                <strong>Current Odometer:</strong> {selectedTripDetails.vehicle_id?.odometer || 0} km
                                            </li>
                                        </ul>
                                    </div>
                                </Col>
                            </Row>

                            {/* Completion & Notes Section side-by-side to minimize height */}
                            {(() => {
                                const hasTimeline = !!(selectedTripDetails.dispatched_at || selectedTripDetails.completed_at || selectedTripDetails.cancelled_at);
                                const hasNotes = !!selectedTripDetails.notes;
                                
                                return (hasTimeline || hasNotes) && (
                                    <Row className="mt-2">
                                        {hasTimeline && (
                                            <Col md={hasNotes ? 6 : 12} className="mb-2">
                                                <div className="card border-0 bg-light-subtle p-2 rounded border h-100 mb-0">
                                                    <h5 className="fs-12 text-primary text-uppercase mb-2">
                                                        <i className="ri-history-line align-middle me-1"></i> Trip Timeline & Metrics
                                                    </h5>
                                                    <Row style={{ fontSize: "13px" }}>
                                                        {selectedTripDetails.dispatched_at && (
                                                            <Col md={12} className="mb-1">
                                                                <strong>Dispatched:</strong> <span className="text-muted">{new Date(selectedTripDetails.dispatched_at).toLocaleString()}</span>
                                                            </Col>
                                                        )}
                                                        {selectedTripDetails.completed_at && (
                                                            <>
                                                                <Col md={12} className="mb-1">
                                                                    <strong>Completed:</strong> <span className="text-muted">{new Date(selectedTripDetails.completed_at).toLocaleString()}</span>
                                                                </Col>
                                                                <Col md={12} className="mb-1">
                                                                    <strong>Final Odo:</strong> <span className="text-muted">{selectedTripDetails.final_odometer} km</span>
                                                                </Col>
                                                                <Col md={12} className="mb-0">
                                                                    <strong>Fuel Consumed:</strong> <span className="text-muted">{selectedTripDetails.fuel_consumed ? `${selectedTripDetails.fuel_consumed} Liters` : "N/A"}</span>
                                                                </Col>
                                                            </>
                                                        )}
                                                        {selectedTripDetails.cancelled_at && (
                                                            <>
                                                                <Col md={12} className="mb-1">
                                                                    <strong>Cancelled:</strong> <span className="text-muted">{new Date(selectedTripDetails.cancelled_at).toLocaleString()}</span>
                                                                </Col>
                                                                <Col md={12} className="mb-0">
                                                                    <strong>Reason:</strong> <span className="text-danger">{selectedTripDetails.cancellation_reason || "None"}</span>
                                                                </Col>
                                                            </>
                                                        )}
                                                    </Row>
                                                </div>
                                            </Col>
                                        )}
                                        {hasNotes && (
                                            <Col md={hasTimeline ? 6 : 12} className="mb-2">
                                                <div className="card border-0 bg-light p-2 rounded h-100 mb-0" style={{ fontSize: "13px" }}>
                                                    <strong>Notes & Special Instructions:</strong>
                                                    <p className="mb-0 text-muted mt-1" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                                                        {selectedTripDetails.notes}
                                                    </p>
                                                </div>
                                            </Col>
                                        )}
                                    </Row>
                                );
                            })()}
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light py-2 px-3">
                    <Button color="secondary" size="sm" onClick={() => setModalView(false)}>Close</Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default TripManagement;
