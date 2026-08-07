import Register from "../auth/Register";
import { Card } from "../../components/ui/Card";

// Renders the shared Register form inside the Ethics portal's own header/footer (instead of the
// generic AuthLayout) so signing up doesn't feel like leaving the Ethics site.
export default function EthicsRegister() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <Card className="p-8">
        <Register />
      </Card>
    </div>
  );
}
