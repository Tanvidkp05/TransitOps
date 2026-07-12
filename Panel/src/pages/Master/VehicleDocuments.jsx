import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, FormGroup, Label } from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import Select from "react-select";
import { toast } from "react-toastify";
import VehicleDocumentsSection from "./VehicleDocumentsSection";
import { getAllVehicles } from "../../api/vehicles.api";

const VehicleDocuments = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
	const fetch = async () => {
	  try {
		const res = await getAllVehicles();
		const list = res.data?.data || [];
		const opts = list.map((v) => ({ value: v._id, label: `${v.registration_number} — ${v.name_model || v.type || ""}` }));
		setVehicles(opts);
	  } catch (err) {
		console.error("Failed to fetch vehicles", err);
		toast.error("Failed to load vehicles");
	  }
	};
	fetch();
  }, []);

  return (
	<div className="page-content">
	  <Container fluid>
		<BreadCrumb title="Vehicle Documents" pageTitle="Master" />

		<Row>
		  <Col lg={12}>
			<Card>
			  <CardBody>
				<FormGroup>
				  <Label>Select Vehicle</Label>
				  <Select
					options={vehicles}
					value={vehicles.find((v) => v.value === selectedVehicle) || null}
					onChange={(opt) => setSelectedVehicle(opt ? opt.value : null)}
					placeholder="Select vehicle..."
				  />
				</FormGroup>
				{selectedVehicle ? (
				  <VehicleDocumentsSection vehicleId={selectedVehicle} />
				) : (
				  <div className="text-muted">Select a vehicle to manage documents.</div>
				)}
			  </CardBody>
			</Card>
		  </Col>
		</Row>
	  </Container>
	</div>
  );
};

export default VehicleDocuments;
