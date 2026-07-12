import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { AuthContext } from "../../context/AuthContext";
import api from "../../api/index";
import { ENDPOINTS } from "../../api/endpoints";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const COLORS = ["#2563eb", "#dbeafe"];

const Dashboard = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const { adminData } = useContext(AuthContext);

    const [vehicles, setVehicles] = useState([]);
    const [trips, setTrips] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    const getGreeting = () => {
        if (currentHour < 12) return "Good Morning";
        if (currentHour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    useEffect(() => {
        document.title = `Dashboard | ${adminData?.companyName || adminData?.employeeName || "TransitOps"}`;

        const fetchAll = async () => {
            setLoading(true);
            try {
                const [vRes, tRes, dRes] = await Promise.all([
                    api.get(ENDPOINTS.VEHICLES.BASE),
                    api.get(ENDPOINTS.TRIPS.BASE),
                    api.get(ENDPOINTS.DRIVERS.BASE),
                ]);

                setVehicles(Array.isArray(vRes.data?.data) ? vRes.data.data : []);
                setTrips(Array.isArray(tRes.data?.data) ? tRes.data.data : []);
                // drivers API returns list inside data; normalize
                let drv = [];
                if (Array.isArray(dRes.data?.data)) drv = dRes.data.data;
                else if (Array.isArray(dRes.data)) drv = dRes.data;
                setDrivers(drv);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Compute KPIs
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter((v) => v.status === "Available").length;
    const inMaintenance = vehicles.filter((v) => v.status === "In Shop" || v.status === "In Maintenance" || v.status === "Maintenance").length;
    const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
    const pendingTrips = trips.filter((t) => t.status === "Draft").length;
    const driversOnDuty = drivers.filter((d) => d.status === "On Trip").length;
    const fleetUtilization = totalVehicles > 0 ? Math.round((activeTrips / totalVehicles) * 100) : 0;

    const kpis = [
        { label: "Active Vehicles", value: totalVehicles },
        { label: "Available Vehicles", value: availableVehicles },
        { label: "In Maintenance", value: inMaintenance },
        { label: "Active Trips", value: activeTrips },
        { label: "Pending Trips", value: pendingTrips },
        { label: "Drivers On Duty", value: driversOnDuty },
        { label: "Fleet Utilization", value: `${fleetUtilization}%` },
    ];

    const vehicleStatus = [
        { name: "Available", count: availableVehicles },
        { name: "On Trip", count: vehicles.filter((v) => v.status === "On Trip").length },
        { name: "In Shop", count: inMaintenance },
        { name: "Retired", count: vehicles.filter((v) => v.status === "Retired").length },
    ];

    // Build recent fuel/distance trend from latest trips
    const fuelTrend = trips
        .slice()
        .sort((a, b) => new Date(a.createdAt || a.completed_at) - new Date(b.createdAt || b.completed_at))
        .slice(-5)
        .map((t) => ({
            date: new Date(t.completed_at || t.createdAt).toLocaleDateString(),
            fuelCost: t.fuel_consumed || 0,
            distance: t.planned_distance || 0,
        }));

    const utilizationData = [
        { name: "Utilized", value: fleetUtilization },
        { name: "Idle", value: 100 - fleetUtilization },
    ];

    const recentTrips = trips
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((t) => ({
            tripId: t.trip_number || t._id,
            vehicle: (t.vehicle_id && (t.vehicle_id.name_model || t.vehicle_id.registration_number)) || "-",
            driver: (t.driver_id && t.driver_id.name) || "-",
            route: `${t.source || ""} ↦ ${t.destination || ""}`,
            cargo: `${t.cargo_weight || ""}`,
            status: t.status,
        }));

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Dashboard" pageTitle="Dashboard" />

                    {/* KPI cards */}
                    <Row className="mb-4">
                        {kpis.map((item) => (
                            <Col key={item.label} xs={12} sm={6} md={4} lg={3} className="mb-3">
                                <Card className="p-3 h-100">
                                    <div className="text-muted small">{item.label}</div>
                                    <div className="h4 mt-2">{loading ? "..." : item.value}</div>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Row className="g-3 mb-4">
                        <Col lg={4}>
                            <Card className="p-3 h-100">
                                <h6>Vehicle Status</h6>
                                <div style={{ height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={vehicleStatus}>
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>

                        <Col lg={5}>
                            <Card className="p-3 h-100">
                                <h6>Fuel & Distance Trend</h6>
                                <div style={{ height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={fuelTrend}>
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="fuelCost" stroke="#2563eb" strokeWidth={2} />
                                            <Line type="monotone" dataKey="distance" stroke="#0f766e" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </Col>

                        <Col lg={3}>
                            <Card className="p-3 h-100">
                                <h6>Alerts</h6>
                                <div className="small">
                                    <div className="d-flex justify-content-between border-bottom py-1">
                                        <span>Expiring Licenses</span>
                                        <strong className="text-danger">4</strong>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom py-1">
                                        <span>Vehicles Due Service</span>
                                        <strong className="text-warning">3</strong>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom py-1">
                                        <span>Overweight Risk</span>
                                        <strong className="text-orange">2</strong>
                                    </div>
                                    <div className="d-flex justify-content-between py-1">
                                        <span>Trip Delays</span>
                                        <strong className="text-danger">5</strong>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="g-3">
                        <Col lg={3}>
                            <Card className="p-3 h-100 text-center">
                                <h6>Fleet Utilization</h6>
                                <div style={{ height: 220 }} className="d-flex align-items-center justify-content-center">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={utilizationData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={2}>
                                                {utilizationData.map((entry, index) => (
                                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="h2 mt-2">{fleetUtilization}%</div>
                            </Card>
                        </Col>

                        <Col lg={9}>
                            <Card className="p-3 h-100">
                                <h6>Recent Trips</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Trip ID</th>
                                                <th>Vehicle</th>
                                                <th>Driver</th>
                                                <th>Route</th>
                                                <th>Cargo</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTrips.map((trip) => (
                                                <tr key={trip.tripId}>
                                                    <td className="font-weight-medium">{trip.tripId}</td>
                                                    <td>{trip.vehicle}</td>
                                                    <td>{trip.driver}</td>
                                                    <td>{trip.route}</td>
                                                    <td>{trip.cargo}</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">{trip.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Dashboard;
