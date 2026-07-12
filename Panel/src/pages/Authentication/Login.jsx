import React, { useContext, useState } from "react";
import {
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Row,
    Button,
    Form,
} from "reactstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import withRouter from "../../Components/Common/withRouter";
import { AuthContext } from "../../context/AuthContext";
import { MenuContext } from "../../context/MenuContext";
import logo from "../../assets/images/logo.jpg";
import { setAuthorization } from "../../api";
import {
    loginCompany,
    sendOtp,
    verifyOtp,
    resetPassword,
} from "../../api/auth.api";
import { useLoginAttempt } from "../../hooks/useLoginAttempt";

const initialState = {
    email: "",
    password: "",
};

const Login = () => {
    const { fetchMenus } = useContext(MenuContext);
    const { setAdminData } = useContext(AuthContext);
    const navigate = useNavigate();
    const [values, setValues] = useState(initialState);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errEmail, setErrEmail] = useState(false);
    const [errPassword, setErrPassword] = useState(false);

    // Forgot password states
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Loading states
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isSendOtpLoading, setIsSendOtpLoading] = useState(false);
    const [isResendOtpLoading, setIsResendOtpLoading] = useState(false);
    const [isVerifyOtpLoading, setIsVerifyOtpLoading] = useState(false);
    const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);

    // Countdown timer for OTP resend
    const [otpCountdown, setOtpCountdown] = useState(0);
    const [otpResendDisabled, setOtpResendDisabled] = useState(false);

    // Consent checkboxes for location and IP tracking
    const [locationConsent, setLocationConsent] = useState(false);
    const [ipConsent, setIpConsent] = useState(false);

    // Login attempt limitation hook
    const {
        isLocked,
        attemptsRemaining,
        formattedTime,
        updateFromResponse,
        fetchStatus: fetchLoginStatus,
    } = useLoginAttempt(values.email);

    // Timer interval ref
    const timerRef = React.useRef(null);

    // Handle timer effect
    React.useEffect(() => {
        if (otpCountdown > 0) {
            timerRef.current = setInterval(() => {
                setOtpCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setOtpResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [otpCountdown]);

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    };

    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    // Function to get user's IP address
    const getUserIP = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to get IP address:', error);
            return 'unknown';
        }
    };

    // Function to get user's location with high accuracy
    const getUserLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser');
                resolve({ latitude: null, longitude: null });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Geolocation obtained:', {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy + ' meters'
                    });
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    resolve({ latitude: null, longitude: null });
                },
                {
                    // enableHighAccuracy: true,  // Request GPS-level accuracy
                    timeout: 15000,             // Wait up to 15 seconds
                    maximumAge: 120000               // Don't use cached position, get fresh location
                }
            );
        });
    };

    const login = async (e) => {
        // Prevent form submission which causes page refresh
        if (e) {
            e.preventDefault();
        }

        setIsSubmit(true);
        setFormErrors(validate(values));

        // If validation errors, don't proceed
        if (Object.keys(validate(values)).length > 0) return;

        // Validate consent checkboxes - just return to show inline error, no toast needed
        if (!locationConsent || !ipConsent) {
            return;
        }

        // Show confirmation alert before proceeding
        const confirmMessage = `By proceeding, you confirm that you agree to share:

• Your IP Address - for security logging
• Your Location - for security verification

This information will be used to monitor and protect your account from unauthorized access.

Do you want to continue?`;

        if (!window.confirm(confirmMessage)) {
            toast.info("Login cancelled. Please accept the sharing consent to continue.");
            return;
        }

        // Check if account is locked before attempting login
        if (isLocked) {
            toast.error(`Your account is locked. Try again in ${formattedTime}`);
            return;
        }

        setIsLoginLoading(true);

        try {
            // Capture IP address and location
            const userLocation = await getUserLocation();


            // Create headers with security information
            const securityHeaders = {
                'X-Client-Latitude': userLocation.latitude?.toString() || '',
                'X-Client-Longitude': userLocation.longitude?.toString() || '',
            };

            loginCompany({
                email: values.email,
                password: values.password,
                locationConsent: locationConsent,
                ipConsent: ipConsent,
                clientLatitude: userLocation.latitude,
                clientLongitude: userLocation.longitude,
            }, securityHeaders)
                .then((res) => {
                    // Handle based on status code
                    const status = res.status || res.data?.status;

                    if (status === 423) {
                        updateFromResponse(res.data);
                        toast.error(
                            res.data.message ||
                            "Your account is locked due to multiple failed login attempts."
                        );
                        return;
                    }

                    if (status === 401) {
                        // Invalid credentials
                        updateFromResponse(res.data);
                        const remaining = res.data.attemptsRemaining;
                        if (remaining !== undefined) {
                            if (remaining === 0) {
                                toast.error(
                                    "Your account has been locked due to too many failed attempts."
                                );
                            } else {
                                toast.error(
                                    `Invalid credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""
                                    } remaining.`
                                );
                            }
                        } else {
                            toast.error(res.data.message || "Invalid credentials");
                        }
                        return;
                    }

                    if (res.data.isOk) {
                        localStorage.setItem("role", res.data.role);
                        setAdminData({ ...res.data.data });
                        fetchMenus();
                        navigate("/dashboard");
                    } else {
                        toast.error(res.data.message || "Authentication failed!");
                    }
                })
                .catch((err) => {
                    // Handle axios error responses
                    if (err.response) {
                        const { status, data } = err.response;
                        if (status === 423) {
                            updateFromResponse(data);
                            toast.error(
                                data.message ||
                                "Your account is locked due to multiple failed login attempts."
                            );
                        } else if (status === 401) {
                            updateFromResponse(data);
                            const remaining = data.attemptsRemaining;
                            if (remaining !== undefined) {
                                toast.error(
                                    `Invalid credentials. ${remaining} attempt${remaining !== 1 ? "s" : ""
                                    } remaining.`
                                );
                            } else {
                                toast.error(data.message || "Invalid credentials");
                            }
                        } else {
                            toast.error(data.message || "Authentication failed!");
                        }
                    } else {
                        toast.error(err.message || "Authentication failed!");
                    }
                })
                .finally(() => {
                    setIsLoginLoading(false);
                    // Refresh login status after attempt
                    fetchLoginStatus();
                });
        } catch (error) {
            console.error("Login error:", error);
            toast.error("An error occurred during login. Please try again.");
            setIsLoginLoading(false);
        }
    };

    const validate = (values) => {
        const errors = {};
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!values.email) {
            errors.email = "Email is required!";
            setErrEmail(true);
        } else if (!regex.test(values.email)) {
            errors.email = "Invalid Email address!";
            setErrEmail(true);
        } else {
            setErrEmail(false);
        }
        if (!values.password) {
            errors.password = "Password is required!";
            setErrPassword(true);
        } else {
            setErrPassword(false);
        }
        return errors;
    };

    // Handle forgot password email submission with countdown
    const handleSendOTP = () => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!forgotPasswordEmail || !regex.test(forgotPasswordEmail)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsSendOtpLoading(true);
        sendOtp({
            email: forgotPasswordEmail,
        })
            .then((res) => {
                setIsSendOtpLoading(false);
                if (res.data.isOk) {
                    toast.success("OTP sent to your email");
                    setForgotPasswordStep(2);

                    // Start the countdown timer
                    setOtpResendDisabled(true);
                    setOtpCountdown(60);
                } else {
                    toast.error(res.data.message || "Failed to send OTP");

                    // If server returns a remainingTime, use that for the countdown
                    if (res.data.remainingTime) {
                        setOtpResendDisabled(true);
                        setOtpCountdown(res.data.remainingTime);
                    }
                }
            })
            .catch((err) => {
                setIsSendOtpLoading(false);

                // Handle the specific 429 error case with remaining time
                if (
                    err.response &&
                    err.response.status === 429 &&
                    err.response.data.remainingTime
                ) {
                    toast.error(
                        err.message || "Please wait before requesting a new OTP"
                    );
                    setOtpResendDisabled(true);
                    setOtpCountdown(err.response.data.remainingTime);
                } else {
                    toast.error(
                        (err.response &&
                            err.response.data &&
                            err.response.data.message) ||
                        err.message ||
                        "Failed to send OTP"
                    );
                }
            });
    };

    // Handle OTP resend
    const handleResendOTP = () => {
        if (otpResendDisabled) return;

        setIsResendOtpLoading(true);
        sendOtp({
            email: forgotPasswordEmail,
        })
            .then((res) => {
                setIsResendOtpLoading(false);
                if (res.data.isOk) {
                    toast.success("OTP resent to your email");

                    // Start the countdown timer
                    setOtpResendDisabled(true);
                    setOtpCountdown(60);
                } else {
                    toast.error(res.data.message || "Failed to resend OTP");

                    // If server returns a remainingTime, use that for the countdown
                    if (res.data.remainingTime) {
                        setOtpResendDisabled(true);
                        setOtpCountdown(res.data.remainingTime);
                    }
                }
            })
            .catch((err) => {
                setIsResendOtpLoading(false);

                // Handle the specific 429 error case with remaining time
                if (
                    err.response &&
                    err.response.status === 429 &&
                    err.response.data.remainingTime
                ) {
                    toast.error(
                        err.message || "Please wait before requesting a new OTP"
                    );
                    setOtpResendDisabled(true);
                    setOtpCountdown(err.response.data.remainingTime);
                } else {
                    toast.error(err.message || "Failed to resend OTP");
                }
            });
    };

    // Handle OTP verification
    const handleVerifyOTP = () => {
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setIsVerifyOtpLoading(true);
        verifyOtp({
            email: forgotPasswordEmail,
            otp: otp,
        })
            .then((res) => {
                setIsVerifyOtpLoading(false);
                if (res.data.isOk) {
                    toast.success("OTP verified successfully");
                    setForgotPasswordStep(3);
                } else {
                    toast.error(res.data.message || "Invalid OTP");
                }
            })
            .catch((err) => {
                setIsVerifyOtpLoading(false);
                toast.error(err.message || "Failed to verify OTP");
            });
    };

    // Handle password reset
    const handleResetPassword = () => {
        if (newPassword.length < 6) {
            toast.error("Password should be at least 6 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setIsResetPasswordLoading(true);
        resetPassword({
            email: forgotPasswordEmail,
            otp: otp,
            newPassword: newPassword,
        })
            .then((res) => {
                setIsResetPasswordLoading(false);
                if (res.data.isOk) {
                    toast.success("Password reset successfully");
                    // Reset to login form
                    setForgotPasswordMode(false);
                    setForgotPasswordStep(1);
                    setForgotPasswordEmail("");
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                } else {
                    toast.error(res.message || "Failed to reset password");
                }
            })
            .catch((err) => {
                setIsResetPasswordLoading(false);
                toast.error(err.message || "Failed to reset password");
            });
    };

    // Handle back to login
    const handleBackToLogin = () => {
        setForgotPasswordMode(false);
        setForgotPasswordStep(1);
        setForgotPasswordEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
    };

    document.title = `Sign in | TransitOps`;

    // Render forgot password form based on current step
    const renderForgotPasswordForm = () => {
        switch (forgotPasswordStep) {
            case 1: // Email input
                return (
                    <>
                        <div className="text-center">
                            <h2
                                className="mobile-heading"
                                style={{ color: "#0d6efd", fontWeight: "700" }}
                            >
                                FORGOT PASSWORD
                            </h2>
                            <p className="text-muted">
                                Enter your email to reset password
                            </p>
                        </div>
                        <div className="p-2 mt-4">
                            <div className="mb-3">
                                <Label
                                    htmlFor="forgotPasswordEmail"
                                    className="form-label"
                                >
                                    Email
                                </Label>
                                <Input
                                    id="forgotPasswordEmail"
                                    className="form-control"
                                    placeholder="Enter email"
                                    type="email"
                                    value={forgotPasswordEmail}
                                    onChange={(e) =>
                                        setForgotPasswordEmail(e.target.value)
                                    }
                                    disabled={isSendOtpLoading}
                                />
                            </div>
                            <div className="mt-4">
                                <Button
                                    color="primary"
                                    className="w-100"
                                    onClick={handleSendOTP}
                                    disabled={isSendOtpLoading}
                                >
                                    {isSendOtpLoading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Sending...
                                        </>
                                    ) : (
                                        "Send OTP"
                                    )}
                                </Button>
                            </div>
                            <div className="mt-3 text-center">
                                <p className="mb-0">
                                    <a
                                        href="#"
                                        className="fw-medium text-primary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleBackToLogin();
                                        }}
                                        disabled={isSendOtpLoading}
                                    >
                                        Back to Login
                                    </a>
                                </p>
                            </div>
                        </div>
                    </>
                );
            case 2: // OTP verification
                return (
                    <>
                        <div className="text-center">
                            <h2
                                className="mobile-heading"
                                style={{ color: "#0d6efd", fontWeight: "700" }}
                            >
                                VERIFY OTP
                            </h2>
                            <p className="text-muted">
                                Enter the OTP sent to your email
                            </p>
                        </div>
                        <div className="p-2 mt-4">
                            <div className="mb-3">
                                <Label htmlFor="otp" className="form-label">
                                    OTP
                                </Label>
                                <Input
                                    id="otp"
                                    className="form-control"
                                    placeholder="Enter 6-digit OTP"
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    disabled={isVerifyOtpLoading}
                                />
                                {otpCountdown > 0 && (
                                    <small className="text-muted">
                                        You can resend OTP in{" "}
                                        {formatTime(otpCountdown)}
                                    </small>
                                )}
                            </div>
                            <div className="mt-4">
                                <Button
                                    color="primary"
                                    className="w-100"
                                    onClick={handleVerifyOTP}
                                    disabled={isVerifyOtpLoading}
                                >
                                    {isVerifyOtpLoading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify OTP"
                                    )}
                                </Button>
                            </div>
                            <div className="mt-3 d-flex justify-content-between">
                                <p className="mb-0">
                                    <a
                                        href="#"
                                        className="fw-medium text-primary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setForgotPasswordStep(1);
                                        }}
                                        disabled={isVerifyOtpLoading}
                                    >
                                        Back
                                    </a>
                                </p>
                                <p className="mb-0">
                                    <a
                                        href="#"
                                        className={`fw-medium ${otpResendDisabled ||
                                            isResendOtpLoading
                                            ? "text-muted"
                                            : "text-primary"
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (
                                                !otpResendDisabled &&
                                                !isResendOtpLoading
                                            ) {
                                                handleResendOTP();
                                            }
                                        }}
                                        style={{
                                            cursor:
                                                otpResendDisabled ||
                                                    isResendOtpLoading
                                                    ? "default"
                                                    : "pointer",
                                        }}
                                    >
                                        {isResendOtpLoading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                Resending...
                                            </>
                                        ) : (
                                            "Resend OTP"
                                        )}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </>
                );
            case 3: // Reset password
                return (
                    <>
                        <div className="text-center">
                            <h2
                                className="mobile-heading"
                                style={{ color: "#0d6efd", fontWeight: "700" }}
                            >
                                RESET PASSWORD
                            </h2>
                            <p className="text-muted">
                                Enter your new password
                            </p>
                        </div>
                        <div className="p-2 mt-4">
                            <div className="mb-3">
                                <Label
                                    htmlFor="newPassword"
                                    className="form-label"
                                >
                                    New Password
                                </Label>
                                <Input
                                    id="newPassword"
                                    className="form-control"
                                    placeholder="Enter new password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    disabled={isResetPasswordLoading}
                                />
                            </div>
                            <div className="mb-3">
                                <Label
                                    htmlFor="confirmPassword"
                                    className="form-label"
                                >
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    className="form-control"
                                    placeholder="Confirm new password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    disabled={isResetPasswordLoading}
                                />
                            </div>
                            <div className="mt-4">
                                <Button
                                    color="primary"
                                    className="w-100"
                                    onClick={handleResetPassword}
                                    disabled={isResetPasswordLoading}
                                >
                                    {isResetPasswordLoading ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>
                                            Resetting...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <style>
                {`
                    @media (max-width: 767px) {
                        .auth-wrapper {
                            flex-direction: column;
                            overflow-y: auto;
                        }
                        .left-panel {
                            display: none !important;
                        }
                        .right-panel {
                            width: 100% !important;
                            min-height: 100vh !important;
                            height: auto !important;
                        }
                        .mobile-logo {
                            width: 80px !important;
                        }
                        .mobile-heading {
                            font-size: 1.5rem !important;
                        }
                        .mobile-card-body {
                            padding: 2rem 1.5rem !important;
                        }
                    }
                    @media (min-width: 768px) and (max-width: 991px) {
                        .left-panel {
                            width: 50% !important;
                        }
                        .right-panel {
                            width: 50% !important;
                        }
                    }
                `}
            </style>
            <div className="auth-wrapper d-flex" style={{ height: "100vh" }}>
                <div
                    className="left-panel d-flex align-items-center justify-content-center"
                    style={{
                        backgroundColor: "#e7f3ff",
                        width: "55%",
                        height: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    <h1
                        style={{
                            fontSize: "4.5rem",
                            fontWeight: "800",
                            letterSpacing: "-0.05em",
                            fontFamily: "'Plus Jakarta Sans', 'Inter', 'Segoe UI', Roboto, sans-serif",
                            margin: 0,
                            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            textShadow: "0 4px 12px rgba(30, 58, 138, 0.1)",
                        }}
                    >
                        TransitOps
                    </h1>
                </div>
                <div
                    className="right-panel d-flex align-items-center justify-content-center"
                    style={{
                        width: "45%",
                        backgroundColor: "white",
                        height: "100vh",
                    }}
                >
                    <Container>
                        <Row className="justify-content-center">
                            <Col xs={12} sm={12} md={10} lg={6} xl={12}>
                                <Card
                                    style={{
                                        border: "none",
                                        boxShadow: "0 4px 24px rgba(0,0,0,0)",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <CardBody className="p-5 mobile-card-body">
                                        {!forgotPasswordMode ? (
                                            <>
                                                <div className="text-center mb-4">

                                                    <h2
                                                        className="mobile-heading"
                                                        style={{
                                                            color: "#0d6efd",
                                                            fontWeight: "700",
                                                            letterSpacing:
                                                                "1px",
                                                        }}
                                                    >
                                                        LOGIN
                                                    </h2>
                                                    <p
                                                        className="text-muted"
                                                        style={{
                                                            fontSize: "0.9rem",
                                                        }}
                                                    >
                                                        Welcome back! Please
                                                        login to your account.
                                                    </p>
                                                </div>
                                                <Form>
                                                    {/* Account Lock Warning */}
                                                    {isLocked && (
                                                        <div
                                                            style={{
                                                                backgroundColor: "#ff7675",
                                                                color: "white",
                                                                padding: "12px 16px",
                                                                borderRadius: "8px",
                                                                marginBottom: "16px",
                                                                borderLeft: "4px solid #d63031",
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                                                                🔒 Account Locked
                                                            </div>
                                                            <div style={{ fontSize: "0.9rem" }}>
                                                                Your account is locked due to multiple failed login attempts.
                                                                {formattedTime && (
                                                                    <span>
                                                                        {" "}Try again in <strong>{formattedTime}</strong>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ marginTop: "8px", fontSize: "0.85rem" }}>
                                                                <a
                                                                    href="#forgot"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setForgotPasswordMode(true);
                                                                    }}
                                                                    style={{
                                                                        color: "white",
                                                                        textDecoration: "underline",
                                                                    }}
                                                                >
                                                                    Forgot Password?
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Low Attempts Warning */}
                                                    {!isLocked && attemptsRemaining > 0 && attemptsRemaining < 3 && (
                                                        <div
                                                            style={{
                                                                backgroundColor: "#ffeaa7",
                                                                color: "#856404",
                                                                padding: "12px 16px",
                                                                borderRadius: "8px",
                                                                marginBottom: "16px",
                                                                borderLeft: "4px solid #fdcb6e",
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: "600" }}>
                                                                ⚠️ Warning: {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
                                                            </div>
                                                            <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                                                                Your account will be locked after {attemptsRemaining} more failed {attemptsRemaining !== 1 ? "attempts" : "attempt"}.
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="p-2 mt-4">
                                                        <div className="mb-3">
                                                            <Label
                                                                htmlFor="email"
                                                                className="form-label"
                                                                style={{
                                                                    fontWeight:
                                                                        "500",
                                                                    color: "#495057",
                                                                }}
                                                            >
                                                                Email
                                                            </Label>
                                                            <Input
                                                                onSubmit={login}
                                                                name="email"
                                                                className={
                                                                    errEmail &&
                                                                        isSubmit
                                                                        ? "form-control is-invalid"
                                                                        : "form-control"
                                                                }
                                                                placeholder="Enter email"
                                                                type="email"
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                value={
                                                                    values.email
                                                                }
                                                                style={{
                                                                    borderRadius:
                                                                        "8px",
                                                                    padding:
                                                                        "0.65rem 1rem",
                                                                }}
                                                            />
                                                            {isSubmit &&
                                                                formErrors.email && (
                                                                    <p className="text-danger">
                                                                        {
                                                                            formErrors.email
                                                                        }
                                                                    </p>
                                                                )}
                                                        </div>
                                                        <div className="mb-3">
                                                            <Label
                                                                className="form-label"
                                                                htmlFor="password-input"
                                                                style={{
                                                                    fontWeight:
                                                                        "500",
                                                                    color: "#495057",
                                                                }}
                                                            >
                                                                Password
                                                            </Label>
                                                            <div className="position-relative auth-pass-inputgroup mb-3">
                                                                <Input
                                                                    onSubmit={
                                                                        login
                                                                    }
                                                                    name="password"
                                                                    type={
                                                                        showPassword
                                                                            ? "text"
                                                                            : "password"
                                                                    }
                                                                    className={
                                                                        errPassword &&
                                                                            isSubmit
                                                                            ? "form-control is-invalid"
                                                                            : "form-control pe-5"
                                                                    }
                                                                    placeholder="Enter Password"
                                                                    onChange={
                                                                        handleChange
                                                                    }
                                                                    value={
                                                                        values.password
                                                                    }
                                                                    style={{
                                                                        borderRadius:
                                                                            "8px",
                                                                        padding:
                                                                            "0.65rem 1rem",
                                                                    }}
                                                                />
                                                                <button
                                                                    className="btn btn-link position-absolute end-0 top-0 text-decoration-none text-muted"
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setShowPassword(
                                                                            !showPassword
                                                                        )
                                                                    }
                                                                >
                                                                    {showPassword ? (
                                                                        <i className="ri-eye-off-fill align-middle"></i>
                                                                    ) : (
                                                                        <i className="ri-eye-fill align-middle"></i>
                                                                    )}
                                                                </button>
                                                            </div>
                                                            {isSubmit &&
                                                                formErrors.password && (
                                                                    <p className="text-danger">
                                                                        {formErrors.password}
                                                                    </p>
                                                                )}
                                                            {/* <div className="text-end mb-2">
                                                                <a
                                                                    style={{
                                                                        color: "#0d6efd",
                                                                        fontWeight:
                                                                            "500",
                                                                    }}
                                                                    href="#"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        setForgotPasswordMode(
                                                                            true
                                                                        );
                                                                    }}
                                                                >
                                                                    Forgot
                                                                    Password?
                                                                </a>
                                                            </div> */}
                                                        </div>

                                                        {/* Consent Checkboxes */}
                                                        <div
                                                            className="consent-section mb-3 p-3"
                                                            style={{
                                                                backgroundColor: "#f8f9fa",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e9ecef",
                                                            }}
                                                        >
                                                            <p
                                                                className="mb-2"
                                                                style={{
                                                                    fontSize: "0.85rem",
                                                                    color: "#6c757d",
                                                                    fontWeight: "500"
                                                                }}
                                                            >
                                                                <i className="ri-shield-check-line me-1"></i>
                                                                Security Consent Required
                                                            </p>
                                                            <div className="form-check mb-2">
                                                                <Input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    id="locationConsent"
                                                                    checked={locationConsent}
                                                                    onChange={(e) => setLocationConsent(e.target.checked)}
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        width: "18px",
                                                                        height: "18px"
                                                                    }}
                                                                />
                                                                <Label
                                                                    className="form-check-label"
                                                                    htmlFor="locationConsent"
                                                                    style={{
                                                                        fontSize: "0.85rem",
                                                                        cursor: "pointer",
                                                                        marginLeft: "4px"
                                                                    }}
                                                                >
                                                                    <i className="ri-map-pin-line me-1" style={{ color: "#0d6efd" }}></i>
                                                                    I consent to location tracking for security purposes
                                                                    {isSubmit && !locationConsent && (
                                                                        <span className="text-danger ms-1" style={{ fontSize: "0.8rem" }}>*Required</span>
                                                                    )}
                                                                </Label>
                                                            </div>
                                                            <div className="form-check">
                                                                <Input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    id="ipConsent"
                                                                    checked={ipConsent}
                                                                    onChange={(e) => setIpConsent(e.target.checked)}
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        width: "18px",
                                                                        height: "18px"
                                                                    }}
                                                                />
                                                                <Label
                                                                    className="form-check-label"
                                                                    htmlFor="ipConsent"
                                                                    style={{
                                                                        fontSize: "0.85rem",
                                                                        cursor: "pointer",
                                                                        marginLeft: "4px"
                                                                    }}
                                                                >
                                                                    <i className="ri-global-line me-1" style={{ color: "#0d6efd" }}></i>
                                                                    I consent to IP address tracking for security purposes
                                                                    {isSubmit && !ipConsent && (
                                                                        <span className="text-danger ms-1" style={{ fontSize: "0.8rem" }}>*Required</span>
                                                                    )}
                                                                </Label>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4">
                                                            <Button
                                                                type="button"
                                                                className="w-100"
                                                                onClick={login}
                                                                disabled={
                                                                    isLoginLoading || isLocked
                                                                }
                                                                style={{
                                                                    backgroundColor:
                                                                        "#0d6efd",
                                                                    borderColor:
                                                                        "#0d6efd",
                                                                    padding:
                                                                        "0.65rem 1rem",
                                                                    borderRadius:
                                                                        "8px",
                                                                    fontWeight:
                                                                        "600",
                                                                    letterSpacing:
                                                                        "0.5px",
                                                                    transition:
                                                                        "all 0.3s ease",
                                                                }}
                                                                onMouseEnter={(
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        !isLoginLoading
                                                                    ) {
                                                                        e.target.style.backgroundColor =
                                                                            "#0b5ed7";
                                                                        e.target.style.boxShadow =
                                                                            "0 4px 12px rgba(13,110,253,0.3)";
                                                                    }
                                                                }}
                                                                onMouseLeave={(
                                                                    e
                                                                ) => {
                                                                    e.target.style.backgroundColor =
                                                                        "#0d6efd";
                                                                    e.target.style.boxShadow =
                                                                        "none";
                                                                }}
                                                            >
                                                                {isLoginLoading ? (
                                                                    <>
                                                                        <span
                                                                            className="spinner-border spinner-border-sm me-2"
                                                                            role="status"
                                                                            aria-hidden="true"
                                                                        ></span>
                                                                        Logging
                                                                        in...
                                                                    </>
                                                                ) : (
                                                                    "Login"
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Form>
                                            </>
                                        ) : (
                                            renderForgotPasswordForm()
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </>
    );
};

export default withRouter(Login);
