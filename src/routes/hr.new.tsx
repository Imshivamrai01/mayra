import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Users, ShieldCheck, Briefcase, DollarSign, Clock } from "lucide-react";
import { Badge, Btn, Card, Field, Input, PageHeader, Select, SuccessModal } from "@/components/kit";
import { money, today, uid, update, useDB } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/new")({
  head: () => ({ meta: [{ title: "New Employee Onboarding — MAYRA Hotel ERP" }] }),
  component: NewEmployeePage,
});

const DEPARTMENTS = ["Front Office", "Housekeeping", "Restaurant", "Kitchen", "Laundry", "Maintenance", "Security", "HR", "Finance", "IT", "Management"];
const DESIGNATIONS = ["Manager", "Supervisor", "Executive", "Attendant", "Housekeeping Staff", "Waiter", "Captain", "Chef", "Sous Chef", "Cook", "Steward", "Security Guard", "HR Executive", "Accountant", "Front Office Executive", "Receptionist"];
const SHIFTS = ["Morning (07:00 - 15:30)", "General (09:00 - 18:00)", "Evening (14:00 - 22:30)", "Night (22:00 - 07:30)", "Rotational"];

function NewEmployeePage() {
  const db = useDB();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    department: "Front Office",
    designation: "Front Office Executive",
    mobile: "",
    email: "",
    joining: today(),
    salary: "28000",
    shift: "General (09:00 - 18:00)",
    status: "active",
  });

  const [createdEmp, setCreatedEmp] = useState<Employee | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    if (!form.name.trim() || !form.mobile.trim()) {
      toast.error("Employee full name and mobile number are required");
      return;
    }

    let emp!: Employee;
    update((d) => {
      const code = `EMP-${String((d.counters.employee ?? 100) + 1).padStart(3, "0")}`;
      d.counters.employee = (d.counters.employee ?? 100) + 1;
      emp = {
        id: uid("em"),
        code,
        name: form.name,
        department: form.department,
        designation: form.designation,
        phone: form.mobile,
        mobile: form.mobile,
        email: form.email,
        joining: form.joining,
        joinDate: form.joining,
        salary: +form.salary,
        shift: form.shift,
        status: form.status as "active" | "inactive",
      };
      d.employees.unshift(emp);
    });

    setCreatedEmp(emp);
    toast.success(`Staff member onboarded: ${emp.name}!`);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Btn variant="ghost" size="sm" icon={ArrowLeft} onClick={() => nav({ to: "/hr/staff" })}>
          Back to Staff Directory
        </Btn>
        <span className="text-muted-foreground">|</span>
        <Badge tone="primary" className="shimmer-purple-badge px-3 py-1">Staff Onboarding</Badge>
      </div>

      <PageHeader
        title="Add New Employee"
        subtitle="Onboard staff member, assign department, shift and monthly payroll"
      />

      <div className="grid gap-6">
        <Card title="1. Personal & Contact Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sunil Deshmukh" />
            </Field>
            <Field label="Mobile Number" required>
              <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} placeholder="10-digit mobile" />
            </Field>
            <Field label="Email Address">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="staff@mayrahotel.in" />
            </Field>
            <Field label="Date of Joining">
              <Input type="date" value={form.joining} onChange={(e) => set("joining", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="2. Department, Designation & Shift">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Department">
              <Select value={form.department} onChange={(e) => set("department", e.target.value)} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} />
            </Field>
            <Field label="Designation">
              <Select value={form.designation} onChange={(e) => set("designation", e.target.value)} options={DESIGNATIONS.map((d) => ({ value: d, label: d }))} />
            </Field>
            <Field label="Shift Schedule">
              <Select value={form.shift} onChange={(e) => set("shift", e.target.value)} options={SHIFTS.map((s) => ({ value: s, label: s }))} />
            </Field>
          </div>
        </Card>

        <Card title="3. Compensation & Status">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly Gross Salary (₹)" required>
              <Input type="number" min="0" value={form.salary} onChange={(e) => set("salary", e.target.value)} />
            </Field>
            <Field label="Employment Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value)} options={[{ value: "active", label: "Active (On Duty)" }, { value: "inactive", label: "Inactive / On Leave" }]} />
            </Field>
          </div>
          <div className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs flex justify-between items-center border border-border">
            <span>Annual CTC Package:</span>
            <span className="font-bold text-foreground text-sm">{money(+form.salary * 12)} / annum</span>
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Btn variant="outline" size="lg" onClick={() => nav({ to: "/hr/staff" })}>
            Cancel
          </Btn>
          <Btn variant="primary" size="lg" icon={Check} className="shimmer-gold font-bold px-8 shadow-md" onClick={handleSave}>
            Onboard Employee
          </Btn>
        </div>
      </div>

      {createdEmp && (
        <SuccessModal
          open={!!createdEmp}
          onClose={() => nav({ to: "/hr/staff" })}
          title="Employee Onboarded!"
          subtitle="Staff member profile has been activated and added to payroll."
          details={[
            { label: "Employee Code", value: createdEmp.code ?? "EMP" },
            { label: "Name", value: createdEmp.name },
            { label: "Department", value: createdEmp.department },
            { label: "Designation", value: createdEmp.designation },
            { label: "Monthly Salary", value: money(createdEmp.salary) },
          ]}
          primaryAction={{
            label: "View Staff Directory",
            icon: Users,
            onClick: () => nav({ to: "/hr/staff" }),
          }}
          secondaryAction={{
            label: "Return to Dashboard",
            onClick: () => nav({ to: "/" }),
          }}
        />
      )}
    </div>
  );
}
