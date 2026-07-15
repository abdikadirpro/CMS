import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ShieldCheck, RotateCw } from "lucide-react";
import { Input, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useVerifyOtpMutation, useResendOtpMutation } from "../../app/api/authApi";
import { setCredentials } from "../../app/authSlice";

export default function OtpVerification() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  async function onSubmit(values) {
    setServerError("");
    try {
      const res = await verifyOtp({ userId, code: values.code }).unwrap();
      dispatch(setCredentials({ accessToken: res.data.accessToken, actor: res.data.actor }));
      toast.success("Account verified!");
      navigate("/app");
    } catch (err) {
      setServerError(err?.data?.message || "Verification failed");
    }
  }

  async function handleResend() {
    try {
      const res = await resendOtp({ userId }).unwrap();
      toast.success("A new code has been sent");
      if (res.data.devOtp) toast(`Dev code: ${res.data.devOtp}`, { icon: "🔑", duration: 8000 });
    } catch (err) {
      toast.error(err?.data?.message || "Could not resend code");
    }
  }

  if (!userId) {
    return <p className="text-sm text-slate-400">Missing account reference. Please register or log in again.</p>;
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold">Verify your email</h2>
      <p className="mb-6 text-sm text-slate-400">Enter the 6-digit verification code we sent you</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Verification Code</Label>
          <Input
            maxLength={6}
            placeholder="123456"
            className="text-center text-lg tracking-[0.5em]"
            {...register("code", { required: "Code is required", minLength: { value: 6, message: "Enter all 6 digits" }, maxLength: 6 })}
          />
          <FieldError>{errors.code?.message}</FieldError>
        </div>

        {serverError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{serverError}</p>}

        <Button type="submit" className="w-full" loading={isLoading}>
          <ShieldCheck className="h-4 w-4" /> Verify Account
        </Button>
      </form>

      <button
        onClick={handleResend}
        disabled={isResending}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50"
      >
        <RotateCw className="h-3.5 w-3.5" /> Resend code
      </button>
    </div>
  );
}
