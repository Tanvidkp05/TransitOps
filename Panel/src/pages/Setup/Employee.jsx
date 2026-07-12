import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Input,
  Label,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import DataTable from "react-data-table-component";
import DeleteModal from "../../Components/Common/DeleteModal";
import FormsHeader from "../../Components/Common/FormsHeader";
import FormsFooter from "../../Components/Common/FormAddFooter";
import { AuthContext } from "../../context/AuthContext";
import Select from "react-select";
import { toast } from "react-toastify";
import { getAllDepartments } from "../../api/departments.api";
import { getAllCountries, getStatesByCountry, getCitiesByState } from "../../api/locations.api";
import { createEmployee, deleteEmployee, getEmployeeById, updateEmployee, searchEmployees, resetEmployeePassword } from "../../api/employees.api";
import { MenuContext } from "../../context/MenuContext";
import { getAllRoles } from "../../api/roles.api";

const Employee = () => {
  const { adminData, role } = useContext(AuthContext);
  // Basic states
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const [filter, setFilter] = useState(true);
  const [_id, set_Id] = useState("");

  const initialState = {
    employeeName: "",
    departmentId: "",
    emailOffice: "",
    mobileNumber: "",
    countryId: "",
    stateId: "",
    cityId: "",
    address: "",
    password: "",
    isActive: true,
  };

  // Remove file-related states - no longer needed
  
  const [remove_id, setRemove_id] = useState("");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState(initialState);

  // Password reset states
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState("");

  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(100);
  const [pageNo, setPageNo] = useState(0);
  const [column, setcolumn] = useState();
  const [sortDirection, setsortDirection] = useState();

  const [showForm, setShowForm] = useState(false);
  const [updateForm, setUpdateForm] = useState(false);
  const [data, setData] = useState([]);

  const [departmentList, setDepartmentList] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Country/State/City states
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [isStatesLoading, setIsStatesLoading] = useState(false);
  const [isCitiesLoading, setIsCitiesLoading] = useState(false);

  const [roleList, setRoleList] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const {currentPagePermissions} = useContext(MenuContext);

  console.log(currentPagePermissions)

  const getDepartmentList = async () => {
    try {
      const res = await getAllDepartments();
      if (res.data.isOk) {
        setDepartmentList(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    }
  };

  // Fetch countries on component mount
  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllCountries();
      if (response.data.isOk) {
        setCountryList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Failed to load countries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch states by country
  const fetchStatesByCountry = useCallback(async (countryId) => {
    try {
      setIsStatesLoading(true);
      setStateList([]);
      setCityList([]);
      const response = await getStatesByCountry(countryId);
      if (response.data.isOk) {
        setStateList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      toast.error("Failed to load states");
    } finally {
      setIsStatesLoading(false);
    }
  }, []);

  // Fetch cities by state
  const fetchCitiesByState = useCallback(async (stateId) => {
    try {
      setIsCitiesLoading(true);
      setCityList([]);
      const response = await getCitiesByState(stateId);
      if (response.data.isOk) {
        setCityList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities");
    } finally {
      setIsCitiesLoading(false);
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    // This function is kept for compatibility but now uses the new country/state/city approach
    await fetchCountries();
  }, [fetchCountries]);

  const getRoleList = async () => {
    getAllRoles().then((res) => {
      setRoleList(res.data.data);
    });
  }

  useEffect(() => {
    getDepartmentList();
    fetchLocation();
    getRoleList();
  }, [fetchLocation]);

  const columns = [
    {
      name: "Sr No",
      selector: (row, index) => index + 1,
      sortable: true,
      maxWidth: "20px",
    },
    {
      name: "Employee Name",
      selector: (row) => <p className="text-wrap">{row.employeeName}</p>,
      maxWidth: "200px",
    },
    {
      name: "Department",
      selector: (row) => <p className="text-wrap">{row.department.departmentName}</p>,
      sortable: true,
      maxWidth: "200px",
    },
    {
      name: "Email",
      selector: (row) => <p className="text-wrap">{row.emailOffice}</p>,
      sortable: true,
      maxWidth: "250px",
    },
    {
      name: "Phone",
      selector: (row) => row.mobileNumber,
      sortable: true,
      maxWidth: "150px",
    },
    {
      name: "Action",
      selector: (row) => {
        return (
          <div className="d-flex gap-2">
            {currentPagePermissions.edit && <button
              className="btn btn-sm btn-success edit-item-btn"
              data-bs-toggle="modal"
              data-bs-target="#showModal"
              onClick={() => handleTog_edit(row._id)}
            >
              Edit
            </button>}
            {currentPagePermissions.delete && <button
              className="btn btn-sm btn-danger remove-item-btn"
              data-bs-toggle="modal"
              data-bs-target="#deleteRecordModal"
              onClick={() => tog_delete(row._id)}
            >
              Remove
            </button>}
            {!currentPagePermissions.edit && !currentPagePermissions.delete && (
              <span className="text-muted">No actions available</span>
            )}
          </div>
        );
      },
      sortable: false,
      minWidth: "180px",
    },
  ];

  const fetchEmployeeMaster = useCallback(async () => {
    setLoading(true);
    let skip = (pageNo - 1) * perPage;
    if (skip < 0) skip = 0;
    try {
      const response = await searchEmployees({
        skip: skip,
        per_page: perPage,
        sorton: column,
        sortdir: sortDirection,
        match: query,
        isActive: filter,
        branchId: adminData.branchId ? adminData.branchId._id : null,
      });
      if (response.data.data.length > 0) {
        let res = response.data.data[0];
        setData(res.data);
        setTotalRows(res.count);
      } else {
        setData([]);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }, [pageNo, perPage, column, sortDirection, query, filter, adminData.branchId]);

  useEffect(() => {
    fetchEmployeeMaster();
  }, [fetchEmployeeMaster]);

  const validate = (values) => {
    const errors = {};
    if (!values.employeeName) errors.employeeName = "Name is required";
    if (!values.address) errors.address = "Address is required";
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.emailOffice))
      errors.emailOffice = "Invalid email address";
    if (!values.emailOffice) errors.emailOffice = "Email is required";
    // Only require password in add mode
    if (!values.password && !updateForm) errors.password = "Password is required";
    if (!selectedDepartment) errors.department = "Department is required";
    if (!values.countryId) errors.country = "Country is required";
    if (!values.stateId) errors.state = "State is required";
    if (!values.cityId) errors.city = "City is required";
    if (values.officeMobileNumber && values.officeMobileNumber.length !== 10)
      errors.officeMobileNumber = "Phone number should be 10 digits";
    if(!selectedRole) errors.role = "Role is required";
    return errors;
  };

  const handleClick = (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create JSON object instead of FormData
      const employeeData = {
        employeeName: values.employeeName,
        departmentId: selectedDepartment?.value || "",
        countryId: values.countryId,
        stateId: values.stateId,
        cityId: values.cityId,
        roleId: selectedRole?.value || "",
        emailOffice: values.emailOffice,
        mobileNumber: values.mobileNumber,
        address: values.address,
        password: values.password,
        isActive: values.isActive,
      };
      
      createEmployee(employeeData)
        .then((res) => {
          setShowForm(false);
          setValues(initialState);
          setIsSubmit(false);
          setFormErrors({});
          setSelectedDepartment(null);
          setSelectedRole(null);
          // Reset country/state/city lists
          setStateList([]);
          setCityList([]);
          fetchEmployeeMaster();
          toast.success("Employee Added Successfully");
        })
        .catch((err) => {
          console.log(err);
          toast.error("Failed to add employee. Please try again.");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length === 0) {
      setIsLoading(true);
      
      // Create JSON object instead of FormData
      const employeeData = {
        employeeName: values.employeeName,
        departmentId: selectedDepartment?.value || "",
        countryId: values.countryId,
        stateId: values.stateId,
        cityId: values.cityId,
        roleId: selectedRole?.value || "",
        emailOffice: values.emailOffice,
        mobileNumber: values.mobileNumber,
        address: values.address,
        dailyPlan: values.dailyPlan,
        isActive: values.isActive,
      };
      
      updateEmployee(_id, employeeData)
        .then((res) => {
          if (res.data.isOk) {
            toast.success("Employee Updated Successfully");
            setUpdateForm(false);
            setShowForm(false);
            setValues(initialState);
            setIsSubmit(false);
            setFormErrors({});
            setSelectedDepartment(null);
            setSelectedRole(null);
            // Reset country/state/city lists
            setStateList([]);
            setCityList([]);
            fetchEmployeeMaster();
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Cannot update Employee");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    setIsSubmit(false);
    setShowForm(false);
    setUpdateForm(false);
    setValues(initialState);
    setFormErrors({});
    setSelectedDepartment(null);
    setSelectedRole(null);
    // Reset country/state/city lists
    setStateList([]);
    setCityList([]);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    setIsDeleteLoading(true);
    deleteEmployee(remove_id)
      .then((res) => {
        setmodal_delete(!modal_delete);
        fetchEmployeeMaster();
        toast.success("Employee Deleted Successfully");
      })
      .catch((err) => {
        console.log(err);
        toast.error("Cannot delete Employee");
      })
      .finally(() => setIsDeleteLoading(false));
  };

  const handleDeleteClose = (e) => {
    e.preventDefault();
    setmodal_delete(false);
  };

  const handleTog_edit = async (_id) => {
    setIsSubmit(false);
    setUpdateForm(true);
    set_Id(_id);
    setFormErrors({});
    setIsLoading(true);
    setShowResetPassword(false); // Reset the password reset form when editing
    
    try {
      const res = await getEmployeeById(_id);
      if (res.data.isOk) {
        const employeeData = res.data.data;
        setValues({
          ...values,
          employeeName: employeeData.employeeName,
          countryId: employeeData.countryId?._id || employeeData.countryId || "",
          stateId: employeeData.stateId?._id || employeeData.stateId || "",
          cityId: employeeData.cityId?._id || employeeData.cityId || "",
          departmentId: employeeData.departmentId?._id || "",
          emailOffice: employeeData.emailOffice,
          mobileNumber: employeeData.mobileNumber,
          address: employeeData.address,
          isActive: employeeData.isActive,
        });
        
        setSelectedDepartment({
          value: employeeData.departmentId._id,
          label: employeeData.departmentId.departmentName,
        });
        
        setSelectedRole({
          value: employeeData.roleId._id,
          label: employeeData.roleId.roleName,
        });

        // Load states and cities for editing
        if (employeeData.countryId) {
          await fetchStatesByCountry(employeeData.countryId._id || employeeData.countryId);
          
          if (employeeData.stateId) {
            await fetchCitiesByState(employeeData.stateId._id || employeeData.stateId);
          }
        }
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch employee details");
    } finally {
      setIsLoading(false);
    }
  };
  

  const [modal_delete, setmodal_delete] = useState(false);
  const tog_delete = (_id) => {
    setmodal_delete(!modal_delete);
    setRemove_id(_id);
  };

  const handlecheck = (e) => {
    setValues({ ...values, [e.target.name]: e.target.checked });
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === "employeeShortName") {
      newValue = value.toUpperCase();
      setValues({ ...values, [name]: newValue });
    } else if (name === "countryId") {
      // Handle country selection
      const selectedCountry = countryList.find(country => country._id === value);
      if (selectedCountry) {
        setValues({ 
          ...values, 
          countryId: value,
          stateId: "",
          cityId: ""
        });
        // Fetch states for selected country
        await fetchStatesByCountry(value);
      }
    } else if (name === "stateId") {
      // Handle state selection
      setValues({ 
        ...values, 
        stateId: value,
        cityId: ""
      });
      // Fetch cities for selected state
      await fetchCitiesByState(value);
    } else if (name === "cityId") {
      // Handle city selection
      setValues({ ...values, cityId: value });
    } else {
      setValues({ ...values, [name]: newValue });
    }
  };

  const handleSort = (column, sortDirection) => {
    setcolumn(column.sortField);
    setsortDirection(sortDirection);
  };

  const handlePageChange = (page) => {
    setPageNo(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
  };

  const handleFilter = (e) => {
    setFilter(e.target.checked);
  };

  const handlePasswordResetChange = (e) => {
    setResetPasswordData({
      ...resetPasswordData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleResetPassword = () => {
    setShowResetPassword(!showResetPassword);
    setPasswordResetError("");
    setResetPasswordData({
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setPasswordResetError("Passwords do not match");
      return;
    }

    if (resetPasswordData.newPassword.length < 6) {
      setPasswordResetError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await resetEmployeePassword(_id, { password: resetPasswordData.newPassword });
      
      if (response.isOk) {
        toast.success("Password reset successfully");
        setShowResetPassword(false);
        setResetPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordResetError("");
      } else {
        toast.error("Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    <CardBody>
      <Col xxl={12}>
        <Card>
          <CardBody>
            <div className="live-preview">
              <Form>
                <Row>
                  <Row>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="employeeName"
                          value={values.employeeName}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Name <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.employeeName}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <Select
                          className="basic-single"
                          classNamePrefix="select"
                          placeholder=""
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "58px",
                              height: "58px",
                              backgroundColor: "transparent",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                          }}
                          options={departmentList.map((department) => ({
                            value: department._id,
                            label: department.departmentName,
                          }))}
                          value={selectedDepartment}
                          onChange={(selectedOption) => {
                            setSelectedDepartment(selectedOption);
                          }}
                        />
                        <label
                          className="form-label"
                          style={{
                            opacity: 0.7,
                            transform: "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                          }}
                        >
                          Department <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.department}</p>
                        )}
                      </div>
                    </Col>
                    
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          required
                          name="emailOffice"
                          value={values.emailOffice}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Email Office <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.emailOffice}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <Input
                          type="tel"
                          className="form-control"
                          required
                          name="mobileNumber"
                          value={values.mobileNumber}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^[0-9]+$/.test(value)) {
                              setValues({ ...values, mobileNumber: value });
                            }
                          }}
                          maxLength={10}
                          pattern="[0-9]{10}"
                        />
                        <label className="form-label">
                          Mobile Number
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.mobileNumber}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <Select
                          className="basic-single"
                          classNamePrefix="select"
                          placeholder=""
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "58px",
                              height: "58px",
                              backgroundColor: "transparent",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                          }}
                          options={countryList.map((country) => ({
                            value: country._id,
                            label: country.countryName,
                          }))}
                          value={countryList.find(country => country._id === values.countryId) ? {
                            value: values.countryId,
                            label: countryList.find(country => country._id === values.countryId)?.countryName
                          } : null}
                          onChange={(selectedOption) => {
                            handleChange({ target: { name: "countryId", value: selectedOption.value } });
                          }}
                          isLoading={isLoading}
                        />
                        <label
                          className="form-label"
                          style={{
                            opacity: 0.7,
                            transform: "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                          }}
                        >
                          Country <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.country}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <Select
                          className="basic-single"
                          classNamePrefix="select"
                          placeholder=""
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "58px",
                              height: "58px",
                              backgroundColor: "transparent",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                          }}
                          options={stateList.map((state) => ({
                            value: state._id,
                            label: state.stateName,
                          }))}
                          value={stateList.find(state => state._id === values.stateId) ? {
                            value: values.stateId,
                            label: stateList.find(state => state._id === values.stateId)?.stateName
                          } : null}
                          onChange={(selectedOption) => {
                            handleChange({ target: { name: "stateId", value: selectedOption.value } });
                          }}
                          isLoading={isStatesLoading}
                          isDisabled={!values.countryId}
                        />
                        <label
                          className="form-label"
                          style={{
                            opacity: 0.7,
                            transform: "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                          }}
                        >
                          State <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.state}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <Select
                          className="basic-single"
                          classNamePrefix="select"
                          placeholder=""
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "58px",
                              height: "58px",
                              backgroundColor: "transparent",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                          }}
                          options={cityList.map((city) => ({
                            value: city._id,
                            label: city.cityName,
                          }))}
                          value={cityList.find(city => city._id === values.cityId) ? {
                            value: values.cityId,
                            label: cityList.find(city => city._id === values.cityId)?.cityName
                          } : null}
                          onChange={(selectedOption) => {
                            handleChange({ target: { name: "cityId", value: selectedOption.value } });
                          }}
                          isLoading={isCitiesLoading}
                          isDisabled={!values.stateId}
                        />
                        <label
                          className="form-label"
                          style={{
                            opacity: 0.7,
                            transform: "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                          }}
                        >
                          City <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.city}</p>
                        )}
                      </div>
                    </Col>
                    <Col lg={3}>
                      <div className="form-floating mb-3">
                        <Select
                          className="basic-single"
                          classNamePrefix="select"
                          placeholder=""
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "58px",
                              height: "58px",
                              backgroundColor: "transparent",
                            }),
                            placeholder: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              marginTop: "8px",
                            }),
                          }}
                          options={roleList.map((role) => ({
                            value: role._id,
                            label: role.roleName,
                          }))}
                          value={selectedRole}
                          onChange={(selectedOption) => {
                            setSelectedRole(selectedOption);
                          }}
                        />
                        <label
                          className="form-label"
                          style={{
                            opacity: 0.7,
                            transform: "scale(0.85) translateY(-0.5rem) translateX(0.15rem)",
                          }}
                        >
                          Role <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.role}</p>
                        )}
                      </div>
                    </Col>
                  {!updateForm && (
                      <Col lg={3}>
                        <div className="form-floating mb-3">
                          <input
                            type="text"
                            className="form-control"
                            required
                            name="password"
                            value={values.password}
                            onChange={handleChange}
                          />
                          <label className="form-label">
                            Password <span className="text-danger"> *</span>
                          </label>
                          {isSubmit && (
                            <p className="text-danger">{formErrors.password}</p>
                          )}
                        </div>
                      </Col>
                    )}
                  </Row>
                  <Row>
                    
                  </Row>
                  <Row>
                    <Col lg={12}>
                      <div className="form-floating mb-3">
                        <textarea
                          type="text"
                          className="form-control"
                          style={{ height: "100px" }}
                          required
                          name="address"
                          value={values.address}
                          onChange={handleChange}
                        />
                        <label className="form-label">
                          Address <span className="text-danger"> *</span>
                        </label>
                        {isSubmit && (
                          <p className="text-danger">{formErrors.address}</p>
                        )}
                      </div>
                    </Col>
                  </Row>
                  {/* Password Reset Section - Only show in edit mode */}
                  {updateForm && role === "ADMIN" && (
                    <Row className="mt-4 mb-4">
                      <Col lg={12}>
                        <div className="d-flex align-items-center mb-2">
                          <h5 className="mb-0">Reset Password</h5>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary ms-2"
                            onClick={toggleResetPassword}
                          >
                            {showResetPassword ? "Cancel" : "Change Password"}
                          </button>
                        </div>
                        
                        {showResetPassword && (
                          <div className="password-reset-container border rounded p-3">
                            <Row>
                              <Col lg={5}>
                                <div className="position-relative mb-3">
                                  <Label className="form-label">
                                    New Password <span className="text-danger">*</span>
                                  </Label>
                                  <div className="position-relative">
                                    <Input
                                      type={showNewPassword ? "text" : "password"}
                                      className="form-control"
                                      required
                                      name="newPassword"
                                      value={resetPasswordData.newPassword}
                                      onChange={handlePasswordResetChange}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      tabIndex={-1}
                                    >
                                      <i className={`ri-eye${showNewPassword ? "" : "-off"}-line align-middle`}></i>
                                    </button>
                                  </div>
                                </div>
                              </Col>
                              <Col lg={5}>
                                <div className="position-relative mb-3">
                                  <Label className="form-label">
                                    Confirm Password <span className="text-danger">*</span>
                                  </Label>
                                  <div className="position-relative">
                                    <Input
                                      type={showConfirmPassword ? "text" : "password"}
                                      className="form-control"
                                      required
                                      name="confirmPassword"
                                      value={resetPasswordData.confirmPassword}
                                      onChange={handlePasswordResetChange}
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      tabIndex={-1}
                                    >
                                      <i className={`ri-eye${showConfirmPassword ? "" : "-off"}-line align-middle`}></i>
                                    </button>
                                  </div>
                                </div>
                              </Col>
                              <Col lg={2}>
                                <div className="d-flex align-items-end h-100 mb-3">
                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleResetPassword}
                                  >
                                    Reset Password
                                  </button>
                                </div>
                              </Col>
                            </Row>
                            {passwordResetError && (
                              <div className="text-danger">{passwordResetError}</div>
                            )}
                          </div>
                        )}
                      </Col>
                    </Row>
                  )}
                  
                  <div className="mt-5">
                    <Row>
                      <Col lg={2}>
                        <div className="form-check mb-2">
                          <Input
                            type="checkbox"
                            name="isActive"
                            value={values.isActive}
                            onChange={handlecheck}
                            checked={values.isActive}
                          />
                          <Label className="form-check-label">
                            Is Active
                          </Label>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <Col lg={12}>
                    <FormsFooter
                      handleSubmit={updateForm ? handleUpdate : handleClick}
                      handleSubmitCancel={handleCancel}
                      isLoading={isLoading}
                    />
                  </Col>
                </Row>
              </Form>
            </div>
          </CardBody>
        </Card>
      </Col>
    </CardBody>
  );
  
  const handleList = () => {
    setShowForm(false);
    setUpdateForm(false);
    setIsSubmit(false);
    setValues(initialState);
    setSelectedDepartment(null);
    setSelectedRole(null);
    setFormErrors({});
    setShowResetPassword(false);
    // Reset country/state/city lists
    setStateList([]);
    setCityList([]);
  }

  document.title = `Employee | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb maintitle="Setup" title="Employee" pageTitle="Setup" />
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <FormsHeader
                    formName="Employee"
                    filter={filter}
                    handleFilter={handleFilter}
                    tog_list={() => handleList()}
                    setQuery={setQuery}
                    initialState={initialState}
                    setValues={setValues}
                    updateForm={updateForm}
                    showForm={showForm}
                    setShowForm={setShowForm}
                    setUpdateForm={setUpdateForm}
                    showAddButton={currentPagePermissions.write}
                  />
                </CardHeader>

                {(showForm || updateForm) ? (
                  renderForm()
                ) : (
                  <CardBody>
                    <div className="table-responsive table-card mt-1 mb-1 text-right">
                      <DataTable
                        columns={columns}
                        data={data}
                        progressPending={loading}
                        sortServer
                        onSort={(column, sortDirection) =>
                          handleSort(column, sortDirection)
                        }
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationPerPage={100}
                        paginationRowsPerPageOptions={[
                          50,
                          100,
                          200,
                          300,
                          totalRows,
                        ]}
                        onChangeRowsPerPage={handlePerRowsChange}
                        onChangePage={handlePageChange}
                      />
                    </div>
                  </CardBody>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <DeleteModal
        show={modal_delete}
        handleDelete={handleDelete}
        toggle={handleDeleteClose}
        setmodal_delete={setmodal_delete}
        disabled={isDeleteLoading}
      />
    </React.Fragment>
  );
};

export default Employee;
