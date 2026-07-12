import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, Col, FormGroup, Input, Label, Row, Table } from 'reactstrap';
import { toast } from 'react-toastify';
import { uploadDocument, listDocuments, downloadDocument, deleteDocument } from '../../api/vehicleDocuments.api';

const DOC_TYPES = [
  { value: 'driving_license', label: 'Driving License' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'road_tax', label: 'Road Tax' },
  { value: 'registration_certificate', label: 'Registration Certificate' },
];

const VehicleDocumentsSection = ({ vehicleId }) => {
  const [docs, setDocs] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
	try {
	  const res = await listDocuments(vehicleId);
	  if (res.data?.data) setDocs(res.data.data);
	  else setDocs([]);
	} catch (err) {
	  console.error('Failed to fetch documents', err);
	  toast.error('Failed to load documents');
	}
  };

  useEffect(() => {
	if (vehicleId) fetchDocs();
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const handleFileChange = (e) => {
	const f = e.target.files[0];
	if (!f) return;
	// Only PDF
	if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
	  toast.error('Only PDF files are allowed');
	  e.target.value = '';
	  return;
	}
	// size limit 10MB
	if (f.size > 10 * 1024 * 1024) {
	  toast.error('File size should not exceed 10MB');
	  e.target.value = '';
	  return;
	}
	setFile(f);
  };

  const handleUpload = async () => {
	if (!selectedType) return toast.error('Please select document type');
	if (!file) return toast.error('Please select a PDF file to upload');

	setLoading(true);
	try {
	  const res = await uploadDocument({ vehicleId, docType: selectedType, issueDate, expiryDate, file });
	  if (res.data?.isOk) {
		toast.success('Document uploaded');
		setSelectedType('');
		setIssueDate('');
		setExpiryDate('');
		setFile(null);
		fetchDocs();
	  } else {
		toast.error(res.data?.message || 'Upload failed');
	  }
	} catch (err) {
	  console.error('Upload error', err);
	  toast.error(err.response?.data?.message || 'Upload failed');
	} finally {
	  setLoading(false);
	}
  };

  const handleView = async (doc) => {
	try {
	  const res = await downloadDocument(doc._id);
	  const blob = new Blob([res.data], { type: res.data.type || doc.mimeType || 'application/pdf' });
	  const url = window.URL.createObjectURL(blob);
	  window.open(url, '_blank');
	} catch (err) {
	  console.error('View error', err);
	  toast.error('Failed to open document');
	}
  };

  const handleDownload = async (doc) => {
	try {
	  const res = await downloadDocument(doc._id);
	  const blob = new Blob([res.data], { type: res.data.type || doc.mimeType || 'application/pdf' });
	  const url = window.URL.createObjectURL(blob);
	  const a = document.createElement('a');
	  a.href = url;
	  a.download = doc.originalName || 'document.pdf';
	  document.body.appendChild(a);
	  a.click();
	  a.remove();
	  window.URL.revokeObjectURL(url);
	} catch (err) {
	  console.error('Download error', err);
	  toast.error('Failed to download document');
	}
  };

  const handleDelete = async (doc) => {
	if (!window.confirm('Delete document? This action cannot be undone.')) return;
	try {
	  await deleteDocument(doc._id);
	  toast.success('Document deleted');
	  fetchDocs();
	} catch (err) {
	  console.error('Delete error', err);
	  toast.error('Failed to delete document');
	}
  };

  return (
	<Card className="mt-4">
	  <CardBody>
		<h5>Vehicle Documents</h5>
		<Row className="align-items-end">
		  <Col md={3}>
			<FormGroup>
			  <Label>Document Type</Label>
			  <Input type="select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
				<option value="">Select type</option>
				{DOC_TYPES.map((d) => (
				  <option value={d.value} key={d.value}>{d.label}</option>
				))}
			  </Input>
			</FormGroup>
		  </Col>
		  <Col md={2}>
			<FormGroup>
			  <Label>Issue Date</Label>
			  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
			</FormGroup>
		  </Col>
		  <Col md={2}>
			<FormGroup>
			  <Label>Expiry Date</Label>
			  <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
			</FormGroup>
		  </Col>
		  <Col md={3}>
			<FormGroup>
			  <Label>PDF File</Label>
			  <Input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} />
			</FormGroup>
		  </Col>
		  <Col md={2} className="text-end">
			<Button color="primary" onClick={handleUpload} disabled={loading}>
			  {loading ? 'Uploading...' : 'Upload'}
			</Button>
		  </Col>
		</Row>

		<hr />

		<Table size="sm" bordered responsive>
		  <thead>
			<tr>
			  <th>Type</th>
			  <th>File</th>
			  <th>Issue</th>
			  <th>Expiry</th>
			  <th>Uploaded At</th>
			  <th>Actions</th>
			</tr>
		  </thead>
		  <tbody>
			{docs.length === 0 ? (
			  <tr>
				<td colSpan={6} className="text-center">No documents uploaded</td>
			  </tr>
			) : (
			  docs.map((d) => (
				<tr key={d._id}>
				  <td>{DOC_TYPES.find(x => x.value === d.docType)?.label || d.docType || 'Other'}</td>
				  <td>{d.originalName}</td>
				  <td>{d.issueDate ? new Date(d.issueDate).toLocaleDateString() : '-'}</td>
				  <td>{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '-'}</td>
				  <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}</td>
				  <td>
					<Button color="info" size="sm" className="me-2" onClick={() => handleView(d)}>View</Button>
					<Button color="secondary" size="sm" className="me-2" onClick={() => handleDownload(d)}>Download</Button>
					<Button color="danger" size="sm" onClick={() => handleDelete(d)}>Delete</Button>
				  </td>
				</tr>
			  ))
			)}
		  </tbody>
		</Table>
	  </CardBody>
	</Card>
  );
};

export default VehicleDocumentsSection;
