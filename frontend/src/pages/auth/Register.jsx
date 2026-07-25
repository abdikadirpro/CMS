import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { User, Mail, Phone, Lock, UserPlus } from "lucide-react";
import { Input, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useRegisterMutation } from "../../app/api/authApi";

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  async function onSubmit(values) {
    setServerError("");
    try {
      const res = await registerUser(values).unwrap();
      toast.success("Account created! Check your email for the verification code.");
      navigate(`/verify-otp?userId=${res.data.userId}`);
    } catch (err) {
      setServerError(err?.data?.message || "Registration failed");
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold">Create your account</h2>
      <p className="mb-6 text-sm text-slate-400">Register to submit and track your complaints</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Jane Doe" className="pl-9" {...register("fullName", { required: "Full name is required" })} />
          </div>
          <FieldError>{errors.fullName?.message}</FieldError>
        </div>

        <div>
          <Label>Email Address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input type="email" placeholder="you@example.com" className="pl-9" {...register("email", { required: "Email is required" })} />
          </div>
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <Label>Phone Number</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="+252 61 234 5678" className="pl-9" {...register("phone")} />
          </div>
        </div>

        <div>
          <Label>Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="password"
              placeholder="At least 8 characters"
              className="pl-9"
              {...register("password", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })}
            />
          </div>
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" loading={isLoading}>
          <UserPlus className="h-4 w-4" /> Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
