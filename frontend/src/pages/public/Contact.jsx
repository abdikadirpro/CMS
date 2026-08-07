import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Input, Textarea, Label, FieldError } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Message sent! Our team will get back to you shortly.");
    reset();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-[rgb(var(--fg-muted))]">Have a question about the platform? Reach out and we&apos;ll respond as soon as possible.</p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card className="group flex cursor-default items-center gap-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
              <Mail className="h-5 w-5" />
            </div>
            <span className="text-sm">support@cms.gov</span>
          </Card>
          <Card className="group flex cursor-default items-center gap-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
              <Phone className="h-5 w-5" />
            </div>
            <span className="text-sm">+252 61 000 0000</span>
          </Card>
          <Card className="group flex cursor-default items-center gap-3 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-sm">National Complaint Coordination Office</span>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Full Name</Label>
                <Input {...register("name", { required: "Name is required" })} />
                <FieldError>{errors.name?.message}</FieldError>
              </div>
              <div>
                <Label>Email Address</Label>
                <Input type="email" {...register("email", { required: "Email is required" })} />
                <FieldError>{errors.email?.message}</FieldError>
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input {...register("subject", { required: "Subject is required" })} />
              <FieldError>{errors.subject?.message}</FieldError>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={5} {...register("message", { required: "Message is required" })} />
              <FieldError>{errors.message?.message}</FieldError>
            </div>
            <Button type="submit" loading={isSubmitting}>
              <Send className="h-4 w-4" /> Send Message
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
