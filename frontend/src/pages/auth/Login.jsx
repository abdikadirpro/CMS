import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, LogIn, LayoutDashboard } from "lucide-react";
import { Input, Label, FieldError } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import Button from "../../components/ui/Button";
import { useLoginMutation } from "../../app/api/authApi";
import { setCredentials } from "../../app/authSlice";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { isAuthenticated, actor } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="text-center">
        <h2 className="mb-1 text-2xl font-bold">You&apos;re already signed in</h2>
        <p className="mb-6 text-sm text-slate-400">Signed in as {actor?.fullName || actor?.email}</p>
        <Link to="/app">
          <Button className="w-full"><LayoutDashboard className="h-4 w-4" /> Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  async function onSubmit(values) {
    setServerError("");
    try {
      const res = await login(values).unwrap();
      dispatch(setCredentials({ accessToken: res.data.accessToken, actor: res.data.actor }));
      toast.success("Welcome back!");
      navigate(res.data.actor.type === "USER" ? "/app" : "/app");
    } catch (err) {
      if (err?.data?.errors?.code === "EMAIL_NOT_VERIFIED") {
        toast("Please verify your email first", { icon: "✉️" });
        navigate(`/verify-otp?userId=${err.data.errors.userId}`);
        return;
      }
      setServerError(err?.data?.message || "Login failed");
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold">Welcome back</h2>
      <p className="mb-6 text-sm text-slate-400">Sign in to manage and track complaints</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Email Address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input type="email" placeholder="you@example.com" className="pl-9" {...register("email", { required: "Email is required" })} />
          </div>
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label className="mb-1.5">Password</Label>
            <Link to="/forgot-password" className="mb-1.5 text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <PasswordInput placeholder="••••••••" {...register("password", { required: "Password is required" })} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" loading={isLoading}>
          <LogIn className="h-4 w-4" /> Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
      </p>
    </div>
  );
}
