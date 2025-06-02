import { images } from "../config/variables";
import "../styles/global.css";
import "../styles/loginPage.css";
import FooterContainer from "../components/Footer";
import { signInWithEmail, loginWithGoogle, resetPassword, AuthResponse } from "../config/auth";
import { useState, FormEvent } from "react"
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const handleLogin = async (e?: FormEvent) => {
  
    

    if (e) e.preventDefault();
    setError("");
    try {
      const user = await signInWithEmail(email, password,navigate);
      console.log("Usuario autenticado:", user);
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err.message);
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setMessage("");
    if (!email) {
      setError("Ingresa tu correo para recuperar tu contraseña.");
      return;
    }
    const { error } = await resetPassword(email); /*resetPasssword esta en el auth*/
    if (error) {
      setError("Error al enviar el correo de recuperación.");
    } else {
      setMessage("📧 Revisa tu correo para cambiar tu contraseña.");
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await loginWithGoogle();
    setLoading(false);
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="mainContainer">
      <div className="contentContainerLogin">
        <div className="letreroContainer">
          <div className="welcome-banner">
            <img src={images.logo} alt="Logo" className="logo" />
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
            <p style={{ color: "var(--primary-color)" }} className="error-message">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "var(--primary-color)",
              color: "white",
              "&:hover": {
                backgroundColor: "var(--secondary-color)",
              },
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
  );
};

export default LoginPage;
