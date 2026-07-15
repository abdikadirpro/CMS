import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Save, KeyRound } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Input, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { useUpdateOwnProfileMutation, useChangeOwnPasswordMutation } from "../../app/api/userApi";
import { useUpdateOwnAdminProfileMutation, useChangeOwnAdminPasswordMutation } from "../../app/api/adminApi";
import { setCredentials } from "../../app/authSlice";
import { ADMIN_TYPE_LABELS } from "../../lib/utils";

export default function ProfileSettings() {
  const { actor, isUser } = useAuth();
  const dispatch = useDispatch();

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    defaultValues: { fullName: actor?.fullName, phone: actor?.phone || "" },
  });
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm();

  const [updateUserProfile, { isLoading: savingUserProfile }] = useUpdateOwnProfileMutation();
  const [changeUserPassword, { isLoading: changingUserPassword }] = useChangeOwnPasswordMutation();
  const [updateAdminProfile, { isLoading: savingAdminProfile }] = useUpdateOwnAdminProfileMutation();
  const [changeAdminPassword, { isLoading: changingAdminPassword }] = useChangeOwnAdminPasswordMutation();

  const savingProfile = isUser ? savingUserProfile : savingAdminProfile;
  const changingPassword = isUser ? changingUserPassword : changingAdminPassword;

  async function onProfileSubmit(values) {
    try {
      const mutate = isUser ? updateUserProfile : updateAdminProfile;
      const res = await mutate(values).unwrap();
      dispatch(setCredentials({ actor: { ...actor, ...res.data } }));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  }

  async function onPasswordSubmit(values) {
    try {
      const mutate = isUser ? changeUserPassword : changeAdminPassword;
      await mutate(values).unwrap();
      toast.success("Password changed");
      resetPassword();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-sm text-[rgb(var(--fg-muted))]">
          {isUser ? "Citizen Account" : ADMIN_TYPE_LABELS[actor?.adminType]}
        </p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">Personal Information</h3>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input {...registerProfile("fullName", { required: "Full name is required" })} />
            <FieldError>{profileErrors.fullName?.message}</FieldError>
          </div>
          <div>
            <Label>Email Address</Label>
            <Input value={actor?.email || ""} disabled className="opacity-60" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input {...registerProfile("phone")} />
          </div>
          {isUser && (
            <div>
              <Label>ID Number (Optional)</Label>
              <Input defaultValue={actor?.idNumber || ""} {...registerProfile("idNumber")} />
            </div>
          )}
          <Button type="submit" loading={savingProfile}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Change Password</h3>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <Input type="password" {...registerPassword("currentPassword", { required: "Required" })} />
            <FieldError>{passwordErrors.currentPassword?.message}</FieldError>
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" {...registerPassword("newPassword", { required: "Required", minLength: { value: 8, message: "Minimum 8 characters" } })} />
            <FieldError>{passwordErrors.newPassword?.message}</FieldError>
          </div>
          <Button type="submit" variant="secondary" loading={changingPassword}>
            <KeyRound className="h-4 w-4" /> Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
