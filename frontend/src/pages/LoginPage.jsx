import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

const LoginPage = () => {
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState("idle");
  const [googleError, setGoogleError] = useState("");
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const currentOrigin = window.location.origin;

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!googleBtnRef.current) return undefined;
    if (!googleClientId) {
      setGoogleStatus("missing_client_id");
      return undefined;
    }
    let cancelled = false;
    setGoogleStatus("loading");
    setGoogleError("");

    const handleCredentialResponse = async (response) => {
      if (!response?.credential) return;
      setError("");
      setLoading(true);
      try {
        await googleLogin({ credential: response.credential });
        navigate("/");
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Google sign-in failed.");
      } finally {
        setLoading(false);
      }
    };

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      const containerWidth = googleBtnRef.current?.clientWidth || 320;
      const buttonWidth = Math.max(180, Math.min(360, containerWidth - 2));
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse
      });
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: buttonWidth
      });
      setGoogleStatus("ready");
    };

    const onScriptLoad = () => renderGoogleButton();
    const onScriptError = () => {
      setGoogleStatus("script_error");
      setGoogleError("Could not load Google Identity script. Check internet/ad-block/CSP.");
    };

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener("load", onScriptLoad);
      existingScript.addEventListener("error", onScriptError);
    } else {
      const script = document.createElement("script");
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = onScriptLoad;
      script.onerror = onScriptError;
      document.body.appendChild(script);
    }

    const timeoutId = window.setTimeout(() => {
      if (!cancelled && googleStatus !== "ready" && !window.google?.accounts?.id) {
        setGoogleStatus("script_error");
        setGoogleError("Google sign-in timed out while loading. Try disabling ad-block and refresh.");
      }
    }, 10000);

    const onResize = () => {
      if (!cancelled && window.google?.accounts?.id) {
        renderGoogleButton();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize);
      if (existingScript) {
        existingScript.removeEventListener("load", onScriptLoad);
        existingScript.removeEventListener("error", onScriptError);
      }
    };
  }, [googleClientId, googleLogin, navigate]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register({
          email: form.email,
          username: form.username,
          password: form.password
        });
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate("/");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center temple-pattern p-3 sm:p-4">
      <section className="temple-card w-full max-w-md p-4 sm:p-6">
        <h1 className="font-heading text-2xl text-templeGold">{isRegister ? "Create Account" : "Temple Login"}</h1>
        <p className="mt-1 text-sm text-templeCream/80">Secure access portal for temple inventory.</p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="text-sm">
            Email
            <input
              type="email"
              className="temple-input mt-1"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              required
            />
          </label>

          {isRegister && (
            <label className="text-sm">
              Username (optional)
              <input className="temple-input mt-1" value={form.username} onChange={(e) => onChange("username", e.target.value)} />
            </label>
          )}

          <label className="text-sm">
            Password
            <input
              className="temple-input mt-1"
              type="password"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              required
            />
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={loading} className="temple-button w-full">
            {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
          </button>
        </form>

        <button
          type="button"
          className="mt-3 text-sm text-templeGold underline"
          onClick={() => setIsRegister((prev) => !prev)}
        >
          {isRegister ? "Already have an account? Login" : "Need an account? Register"}
        </button>

        <div className="mt-4 border-t border-templeGold/20 pt-4">
          <p className="mb-2 text-xs text-templeCream/80">Sign in with Google (works for both admin and normal users)</p>
          <div ref={googleBtnRef} className="w-full max-w-full overflow-hidden" />
          <p className="mt-2 text-xs text-templeCream/70 break-all">
            Current site origin: <span className="text-templeGold">{currentOrigin}</span>
          </p>
          <p className="mt-1 text-xs text-templeCream/70">
            Add this exact origin in Google Cloud Console under OAuth Client → Authorized JavaScript origins.
          </p>
          {googleStatus === "missing_client_id" && (
            <p className="mt-2 text-xs text-red-300">Google login unavailable: missing VITE_GOOGLE_CLIENT_ID in frontend/.env</p>
          )}
          {googleStatus === "loading" && <p className="mt-2 text-xs text-templeCream/70">Loading Google sign-in...</p>}
          {googleStatus === "script_error" && <p className="mt-2 text-xs text-red-300">{googleError}</p>}
        </div>

        <p className="mt-4 text-xs text-templeCream/70">
          Passwords for Google accounts are managed by Google and are never stored in this app.
        </p>
        <Link to="/" className="sr-only">
          Home
        </Link>
      </section>
    </main>
  );
};

export default LoginPage;
