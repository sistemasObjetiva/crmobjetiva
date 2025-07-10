  // src/components/LoginPage.tsx
  import React, { useState,  FormEvent } from "react";
  import "../styles/global.css";
  import "../styles/loginPage.css";

  import logo from "../assets/logos/logoObjetiva.png";
  import FooterContainer from "../components/general/Footer";
  import { loginWithEmail, loginWithGoogle, resetPassword } from "../config/auth";
  import { useNavigate } from "react-router-dom";
  import { Button } from "@mui/material";
  import Spinner from "../components/general/Spinner";

  const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    

    // src/components/LoginPage.tsx
  const handleLogin = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(""); setMessage("");

    const { error } = await loginWithEmail(email, password);
    if (error) {
      setError(error.message);
    } else {
      navigate("/inicio");
    }

    setLoading(false);
  };


      const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await loginWithGoogle();
    setLoading(false);
    if (error) {
      setError(error.message);
    }
    // NO hagas navigate('/inicio') aquí; el callback de Google te traerá a "/inicio" 
    // (porque lo pusimos en redirectTo) y Supabase lo parseará.
  };

    const handlePasswordReset = async () => {
      setError("");
      setMessage("");
      if (!email) {
        setError("Ingresa tu correo para recuperar tu contraseña.");
        return;
      }
      const { error } = await resetPassword(email);
      if (error) {
        setError("Error al enviar el correo de recuperación.");
      } else {
        setMessage("📧 Revisa tu correo para cambiar tu contraseña.");
      }
    };

    return (
      <>
      {loading && <Spinner open={loading} />}
      <div className="mainContainer">
        <div className="contentContainerLogin">
          <div className="letreroContainer">
            <div className="welcome-banner">
              <img src={logo} alt="Logo" className="logo" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="loginForm">
            <div className="inputContainer">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="inputContainer">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="error-message" style={{ color: "var(--primary-color)" }}>
                {error}
              </p>
            )}
            {message && (
              <p className="success-message" style={{ color: "green" }}>
                {message}
              </p>
            )}

            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "var(--primary-color)",
                color: "white",
                mt: 1,
                mb: 2,
                "&:hover": { backgroundColor: "var(--secondary-color)" },
              }}
            >
              Iniciar sesión
            </Button>

            <Button
              onClick={handleGoogleLogin}
              variant="outlined"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                width: "100%",
                mb: 2,
                borderColor: "#ccc",
                textTransform: "none",
              }}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                style={{ width: 20, height: 20 }}
              />
              Iniciar con Google
            </Button>

            <div style={{ marginBottom: "1rem" }}>
              <a
                onClick={handlePasswordReset}
                style={{ color: "#0070f3", textDecoration: "underline", cursor: "pointer" }}
              >
                Recuperar Contraseña
              </a>
            </div>
          </form>
        </div>
        <FooterContainer />
      </div>
      </>
    );
  };

  export default LoginPage;
