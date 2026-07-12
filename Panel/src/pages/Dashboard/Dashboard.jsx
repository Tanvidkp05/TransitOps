import React, { useContext } from "react";
import { Container, Row, Col, Card, CardBody } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { AuthContext } from "../../context/AuthContext";

const Dashboard = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const {adminData} = useContext(AuthContext);

    const getGreeting = () => {
        if (currentHour < 12) {
            return "Good Morning";
        } else if (currentHour < 17) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    };

    document.title = `Dashboard | ${adminData.companyName}`;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Dashboard" pageTitle="Dashboard" />
                    
                    {/* Simple Welcome Section */}
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card className="text-center">
                                <CardBody className="py-5">
                                    <div className="mb-4">
                                        <i className="ri-home-line text-primary" style={{ fontSize: "4rem" }}></i>
                                    </div>
                                    <h1 className="text-primary mb-3">{getGreeting()}!</h1>
                                    <h3 className="mb-4">{adminData?.companyName ? adminData.companyName : adminData.employeeName}</h3>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Dashboard;
