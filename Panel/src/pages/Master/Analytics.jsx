import React, { useState, useEffect, useContext, useRef } from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Col,
    Container,
    Row,
    Progress,
} from "reactstrap";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import DataTable from "react-data-table-component";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import { getAnalyticsSummary } from "../../api/analytics.api";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const Analytics = () => {
    const { adminData } = useContext(AuthContext);

    const [isPageLoading, setIsPageLoading] = useState(false);
    const [summary, setSummary] = useState({
        fuelEfficiency: 0,
        fleetUtilization: 0,
        operationalCost: 0,
        fleetRoi: 0,
    });
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [topCostliest, setTopCostliest] = useState([]);
    const [detailedReport, setDetailedReport] = useState([]);

    const chartsRef = useRef(null);

    const fetchAnalytics = async () => {
        setIsPageLoading(true);
        try {
            const res = await getAnalyticsSummary();
            if (res.data?.isOk && res.data.data) {
                const apiData = res.data.data;
                setSummary(apiData.summary || {
                    fuelEfficiency: 0,
                    fleetUtilization: 0,
                    operationalCost: 0,
                    fleetRoi: 0,
                });
                setMonthlyRevenue(apiData.monthlyRevenue || []);
                setTopCostliest(apiData.topCostliestVehicles || []);
                setDetailedReport(apiData.detailedReport || []);
            }
        } catch (error) {
            console.error("Error fetching analytics details:", error);
            toast.error("Failed to load analytics details");
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // CSV Export Handler
    const handleExportCSV = () => {
        try {
            if (detailedReport.length === 0) {
                toast.warning("No data available to export");
                return;
            }

            // Define CSV Headers
            const headers = [
                "Registration Number",
                "Model / Name",
                "Status",
                "Acquisition Cost ($)",
                "Distance Traveled (km)",
                "Maintenance Cost ($)",
                "Fuel Cost ($)",
                "Other Cost ($)",
                "Total Operational Cost ($)",
                "Estimated Revenue ($)",
                "ROI (%)"
            ];

            // Map detailed records to rows
            const rows = detailedReport.map(v => [
                v.registration_number,
                v.name_model,
                v.status,
                v.acquisition_cost,
                v.distance_traveled,
                v.maintenance_cost,
                v.fuel_cost,
                v.other_cost,
                v.total_operational_cost,
                v.revenue,
                v.roi
            ]);

            // Combine into CSV string
            const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

            // Trigger file download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Fleet_Operational_Report_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSV report downloaded successfully!");
        } catch (err) {
            console.error("Error exporting CSV:", err);
            toast.error("Failed to export CSV");
        }
    };

    // PDF Export Handler (Dashboard screen capture + detailed table)
    const handleExportPDF = async () => {
        try {
            setIsPageLoading(true);
            toast.info("Preparing PDF document, please wait...");

            const pdf = new jsPDF("p", "pt", "a4");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // 1. Add Title & Cover Header
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.setTextColor(33, 37, 41);
            pdf.text("Fleet Operations & Analytics Report", 40, 50);

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(108, 117, 125);
            pdf.text(`Generated on: ${new Date().toLocaleString()} | Operator: ${adminData?.companyName || "TransitOps"}`, 40, 70);
            pdf.setLineDash([2, 2], 0);
            pdf.line(40, 80, pageWidth - 40, 80);

            // 2. Add KPI summary block
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(12);
            pdf.setTextColor(33, 37, 41);
            pdf.text("Operational KPI Summary", 40, 105);

            pdf.setDrawColor(220, 224, 230);
            pdf.setFillColor(248, 249, 250);
            pdf.rect(40, 115, pageWidth - 80, 50, "FD");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(108, 117, 125);
            pdf.text("FUEL EFFICIENCY", 60, 132);
            pdf.text("FLEET UTILIZATION", 190, 132);
            pdf.text("OPERATIONAL COST", 330, 132);
            pdf.text("FLEET AVERAGE ROI", 460, 132);

            pdf.setFontSize(14);
            pdf.setTextColor(26, 188, 156); // Teal
            pdf.text(`${summary.fuelEfficiency || 0} km/l`, 60, 152);
            pdf.setTextColor(41, 128, 185); // Blue
            pdf.text(`${summary.fleetUtilization || 0}%`, 190, 152);
            pdf.setTextColor(230, 126, 34); // Orange
            pdf.text(`$${(summary.operationalCost || 0).toLocaleString()}`, 330, 152);
            pdf.setTextColor(39, 174, 96); // Green
            pdf.text(`${summary.fleetRoi || 0}%`, 460, 152);

            // 3. Screen Capture Charts Area using html2canvas
            if (chartsRef.current) {
                const canvas = await html2canvas(chartsRef.current, { scale: 1.5 });
                const imgData = canvas.toDataURL("image/png");
                const imgWidth = pageWidth - 80;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                pdf.addImage(imgData, "PNG", 40, 185, imgWidth, imgHeight);
            }

            // 4. Add detailed table on the next page
            pdf.addPage();
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.setTextColor(33, 37, 41);
            pdf.text("Detailed Vehicle Performance & Cost Ledger", 40, 40);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(108, 117, 125);
            pdf.text("ROI Formula = [Estimated Revenue - (Maintenance Cost + Fuel Cost)] / Acquisition Cost", 40, 55);

            // Table Headers
            let startY = 75;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(255, 255, 255);
            pdf.setFillColor(28, 35, 46); // Dark blue header
            pdf.rect(40, startY, pageWidth - 80, 20, "F");

            pdf.text("REG NUMBER", 45, startY + 13);
            pdf.text("MODEL / NAME", 125, startY + 13);
            pdf.text("STATUS", 225, startY + 13);
            pdf.text("DIST (km)", 295, startY + 13);
            pdf.text("MAINT ($)", 345, startY + 13);
            pdf.text("FUEL ($)", 395, startY + 13);
            pdf.text("REVENUE ($)", 445, startY + 13);
            pdf.text("ROI (%)", 515, startY + 13);

            // Table Body
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(33, 37, 41);

            let currentY = startY + 20;
            detailedReport.forEach((row, index) => {
                // Page break check
                if (currentY > pageHeight - 50) {
                    pdf.addPage();
                    currentY = 40;
                }

                // Alternate row backgrounds
                if (index % 2 === 1) {
                    pdf.setFillColor(245, 246, 248);
                    pdf.rect(40, currentY, pageWidth - 80, 18, "F");
                }

                pdf.text(row.registration_number, 45, currentY + 12);
                pdf.text(row.name_model.length > 18 ? row.name_model.slice(0, 18) + ".." : row.name_model, 125, currentY + 12);
                pdf.text(row.status, 225, currentY + 12);
                pdf.text((row.distance_traveled || 0).toLocaleString(), 295, currentY + 12);
                pdf.text((row.maintenance_cost || 0).toLocaleString(), 345, currentY + 12);
                pdf.text((row.fuel_cost || 0).toLocaleString(), 395, currentY + 12);
                pdf.text((row.revenue || 0).toLocaleString(), 445, currentY + 12);
                
                // Color code ROI positive/negative
                if (row.roi < 0) {
                    pdf.setTextColor(192, 57, 43); // Red
                } else {
                    pdf.setTextColor(39, 174, 96); // Green
                }
                pdf.text(`${row.roi}%`, 515, currentY + 12);
                pdf.setTextColor(33, 37, 41); // Reset to default dark color

                currentY += 18;
            });

            // Save PDF
            pdf.save(`Fleet_Operational_Report_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("PDF report downloaded successfully!");
        } catch (err) {
            console.error("Error exporting PDF:", err);
            toast.error("Failed to generate PDF report");
        } finally {
            setIsPageLoading(false);
        }
    };

    const detailedColumns = [
        {
            name: "Reg Number",
            selector: (row) => row.registration_number,
            sortable: true,
            minWidth: "110px",
        },
        {
            name: "Model / Name",
            selector: (row) => row.name_model,
            sortable: true,
            minWidth: "120px",
        },
        {
            name: "Distance",
            selector: (row) => `${(row.distance_traveled || 0).toLocaleString()} km`,
            sortable: true,
            minWidth: "100px",
        },
        {
            name: "Maintenance",
            selector: (row) => `$${(row.maintenance_cost || 0).toLocaleString()}`,
            sortable: true,
            minWidth: "105px",
        },
        {
            name: "Fuel Cost",
            selector: (row) => `$${(row.fuel_cost || 0).toLocaleString()}`,
            sortable: true,
            minWidth: "100px",
        },
        {
            name: "Operational Cost",
            selector: (row) => `$${(row.total_operational_cost || 0).toLocaleString()}`,
            sortable: true,
            minWidth: "115px",
        },
        {
            name: "Est. Revenue",
            selector: (row) => `$${(row.revenue || 0).toLocaleString()}`,
            sortable: true,
            minWidth: "110px",
        },
        {
            name: "ROI (%)",
            selector: (row) => {
                let badgeClass = "badge bg-success-subtle text-success";
                if (row.roi < 0) badgeClass = "badge bg-danger-subtle text-danger";
                return <span className={badgeClass}>{row.roi}%</span>;
            },
            sortable: true,
            minWidth: "90px",
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

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Analytics" pageTitle="Dashboard" />

                    {/* KPI Widget Row */}
                    <Row className="mb-4">
                        <Col xl={3} md={6}>
                            <Card className="card-animate border-0 border-start border-4 border-teal" style={{ borderColor: "#1abc9c !important" }}>
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Fuel Efficiency</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                {isPageLoading ? "..." : `${summary.fuelEfficiency} km/l`}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-teal-subtle text-teal rounded fs-3" style={{ backgroundColor: "#e8f8f5", color: "#1abc9c" }}>
                                                <i className="ri-oil-fill"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate border-0 border-start border-4 border-primary">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Fleet Utilization</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                {isPageLoading ? "..." : `${summary.fleetUtilization}%`}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded fs-3">
                                                <i className="ri-truck-fill"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate border-0 border-start border-4 border-warning">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Operational Cost</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                {isPageLoading ? "..." : `$${(summary.operationalCost || 0).toLocaleString()}`}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded fs-3">
                                                <i className="ri-wallet-3-fill"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={3} md={6}>
                            <Card className="card-animate border-0 border-start border-4 border-success">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">Vehicle ROI</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-end justify-content-between mt-4">
                                        <div>
                                            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                                                {isPageLoading ? "..." : `${summary.fleetRoi}%`}
                                            </h4>
                                        </div>
                                        <div className="avatar-sm flex-shrink-0">
                                            <span className="avatar-title bg-success-subtle text-success rounded fs-3">
                                                <i className="ri-hand-coin-fill"></i>
                                            </span>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Chart & Summary Row */}
                    <div ref={chartsRef}>
                        <Row className="mb-4">
                            <Col lg={8}>
                                <Card className="h-100">
                                    <CardHeader className="align-items-center d-flex">
                                        <h4 className="card-title mb-0 flex-grow-1">Monthly Revenue</h4>
                                    </CardHeader>
                                    <CardBody>
                                        <div style={{ height: "300px", width: "100%" }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={monthlyRevenue}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                                                    <Bar dataKey="revenue" fill="#405189" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col lg={4}>
                                <Card className="h-100">
                                    <CardHeader className="align-items-center d-flex">
                                        <h4 className="card-title mb-0 flex-grow-1">Top Costliest Vehicles</h4>
                                    </CardHeader>
                                    <CardBody>
                                        <p className="text-muted mb-4">Combined Fuel, Maintenance, and Miscellaneous operational costs</p>
                                        {topCostliest.length > 0 ? (
                                            topCostliest.map((vehicle, idx) => {
                                                const maxCost = topCostliest[0]?.cost || 1;
                                                const percentage = Math.round((vehicle.cost / maxCost) * 100);

                                                // Color progress bar depending on rank
                                                let progressColor = "danger";
                                                if (idx === 1) progressColor = "warning";
                                                if (idx >= 2) progressColor = "primary";

                                                return (
                                                    <div key={vehicle.name} className="mb-4">
                                                        <div className="d-flex justify-content-between mb-1">
                                                            <span className="fw-medium">{vehicle.name} <span className="text-muted font-size-11">({vehicle.name_model})</span></span>
                                                            <span className="fw-semibold">${(vehicle.cost || 0).toLocaleString()}</span>
                                                        </div>
                                                        <Progress value={percentage} color={progressColor} style={{ height: "8px" }} />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-5 text-muted">
                                                <i className="ri-inbox-line fs-2" />
                                                <p className="mt-2">No operational costs registered yet.</p>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* Detailed Fleet Summary Table */}
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader className="align-items-center d-flex justify-content-between">
                                    <h4 className="card-title mb-0">Detailed Fleet Cost Ledger</h4>
                                    <div className="d-flex gap-2">
                                        <Button color="light" size="sm" onClick={handleExportCSV} disabled={isPageLoading}>
                                            <i className="ri-file-excel-2-fill text-success me-1"></i> Export CSV
                                        </Button>
                                        <Button color="success" size="sm" onClick={handleExportPDF} disabled={isPageLoading}>
                                            <i className="ri-file-pdf-fill me-1"></i> Download Report (PDF)
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div className="table-responsive table-card">
                                        <DataTable
                                            columns={detailedColumns}
                                            data={detailedReport}
                                            progressPending={isPageLoading}
                                            pagination
                                            paginationPerPage={50}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Analytics;
