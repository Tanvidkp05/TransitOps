import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, CardBody, FormGroup, Label } from "reactstrap";
import Select from "react-select";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import VehicleDocumentsSection from "./VehicleDocumentsSection";
import { getAllVehicles } from "../../api/vehicles.api";
import { toast } from "react-toastify";

const VehicleDocuments = () => {
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "Vehicle Document Management | TransitOps";
        const fetchVehicles = async () => {
            setLoading(true);
            try {
                const res = await getAllVehicles();
                if (res.data?.data) {
                    const formatted = res.data.data.map(v => ({
                        value: v._id,
                        label: `${v.registration_number} - ${v.name_model} (${v.type})`
                    }));
                    setVehicles(formatted);
                }
            } catch (err) {
                console.error("Error fetching vehicles:", err);
                toast.error("Failed to load vehicle list");
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    const handleChange = (selected) => {
        setSelectedVehicle(selected);
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Vehicle Document Management" pageTitle="Master" />

                    <Row className="mb-4">
                        <Col lg={12}>
                            <Card className="border-0 shadow-sm">
                                <CardBody className="p-4">
                                    <h5 className="mb-3 text-primary fw-semibold">Select Vehicle</h5>
                                    <Row>
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Label for="vehicleSelect" className="form-label text-muted fs-13">
                                                    Choose a vehicle to view or upload document records
                                                </Label>
                                                <Select
                                                    id="vehicleSelect"
                                                    options={vehicles}
                                                    value={selectedVehicle}
                                                    onChange={handleChange}
                                                    placeholder="Search or select vehicle registration number..."
                                                    isLoading={loading}
                                                    isClearable
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {selectedVehicle ? (
                        <Row>
                            <Col lg={12}>
                                <VehicleDocumentsSection vehicleId={selectedVehicle.value} />
                            </Col>
                        </Row>
                    ) : (
                        <Row>
                            <Col lg={12}>
                                <Card className="border-0 shadow-sm text-center py-5">
                                    <CardBody>
                                        <div className="avatar-md mx-auto mb-3">
                                            <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                                                <i className="ri-file-text-line"></i>
                                            </div>
                                        </div>
                                        <h5 className="text-muted fw-semibold">No Vehicle Selected</h5>
                                        <p className="text-muted mb-0 fs-13 mx-auto" style={{ maxWidth: "400px" }}>
                                            Please select a vehicle from the dropdown search select bar above to manage registration certificates, insurance policy logs, permit PDFs, and road tax reports.
                                        </p>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default VehicleDocuments;
