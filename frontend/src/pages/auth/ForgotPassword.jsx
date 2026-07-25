import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, KeyRound, Lock } from "lucide-react";
import { Input, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../../app/api/authApi";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [forgotPassword, { isLoading: sending }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  async function requestCode(values) {
    setServerError("");
    try {
      const res = await forgotPassword({ email: values.email }).unwrap();
      setEmail(values.email);
      toast.success(res.message);
      setStep(2);
    } catch (err) {
      setServerError(err?.data?.message || "Something went wrong");
    }
  }

  async function submitReset(values) {
    setServerError("");
    try {
      await resetPassword({ email, code: values.code, newPassword: values.newPassword }).unwrap();
      toast.success("Password reset! Please sign in.");
      navigate("/login");
    } catch (err) {
      setServerError(err?.data?.message || "Reset failed");
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold">Reset your password</h2>
      <p className="mb-6 text-sm text-slate-400">
        {step === 1 ? "Enter your account email to receive a reset code" : `Enter the code sent to ${email}`}
      </p>

      {step === 1 ? (
        <form onSubmit={handleSubmit(requestCode)} className="space-y-4">
          <div>
            <Label>Email Address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input type="email" placeholder="you@example.com" className="pl-9" {...register("email", { required: "Email is required" })} />
            </div>
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{serverError}</p>}
          <Button type="submit" className="w-full" loading={sending}>
            Send Reset Code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit(submitReset)} className="space-y-4">
          <div>
            <Label>Reset Code</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="123456" className="pl-9" {...register("code", { required: "Code is required" })} />
            </div>
            <FieldError>{errors.code?.message}</FieldError>
          </div>
          <div>
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                type="password"
                placeholder="At least 8 characters"
                className="pl-9"
                {...register("newPassword", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })}
              />
            </div>
            <FieldError>{errors.newPassword?.message}</FieldError>
          </div>
          {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{serverError}</p>}
          <Button type="submit" className="w-full" loading={resetting}>
            Reset Password
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
