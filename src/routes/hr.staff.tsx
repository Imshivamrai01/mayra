import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge, Btn, DataTable, Drawer, Field, Input, KV, PageHeader, Select, StatCard, Tabs } from "@/components/kit";
import { money, today, uid, update, useDB } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { toast } from "sonner";


export const Route = createFileRoute("/hr/staff")({
  head: () => ({ meta: [{ title: "Staff — MAYRA Hotel ERP" }] }),
  component: StaffPage,
});

const DEPARTMENTS = ["Front Office", "Housekeeping", "Restaurant", "Kitchen", "Laundry", "Maintenance", "Security", "HR", "Finance", "IT", "Management"];
const DESIGNATIONS = ["Manager", "Supervisor", "Executive", "Attendant", "Housekeeping Staff", "Waiter", "Captain", "Chef", "Sous Chef", "Cook", "Steward", "Security Guard", "HR Executive", "Accountant", "Front Office Executive", "Receptionist"];

function EmployeeForm({ onClose, employee }: { onClose: () => void; employee?: Employee }) {
  const db = useDB();
  const [form, setForm] = useState({
    name: employee?.name ?? "",
    department: employee?.department ?? "Front Office",
    designation: employee?.designation ?? "Executive",
    mobile: employee?.mobile ?? "",
    email: employee?.email ?? "",
    joinDate: employee?.joinDate ?? today(),
    salary: String(employee?.salary ?? 20000),
    status: employee?.status ?? "active",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    if (!form.name.trim() || !form.mobile.trim()) { toast.error("Name and mobile required"); return; }
    update((d) => {
      if (employee) {
        const e = d.employees.find((x) => x.id === employee.id);
        if (e) { Object.assign(e, { ...form, salary: +form.salary }); }
      } else {
        d.employees.push({
          id: uid("em"), name: form.name, department: form.department, designation: form.designation,
          mobile: form.mobile, email: form.email, joinDate: form.joinDate,
          salary: +form.salary, status: form.status as "active" | "inactive",
        });
      }
    });
    toast.success(employee ? "Employee updated" : "Employee added");
    onClose();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full Name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Mobile"><Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Department"><Select value={form.department} onChange={(e) => set("department", e.target.value)} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} /></Field>
        <Field label="Designation"><Select value={form.designation} onChange={(e) => set("designation", e.target.value)} options={DESIGNATIONS.map((d) => ({ value: d, label: d }))} /></Field>
        <Field label="Join Date"><Input type="date" value={form.joinDate} onChange={(e) => set("joinDate", e.target.value)} /></Field>
        <Field label="Salary (₹)"><Input type="number" min="0" value={form.salary} onChange={(e) => set("salary", e.target.value)} /></Field>
        <Field label="Status"><Select value={form.status} onChange={(e) => set("status", e.target.value)} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></Field>
      </div>
      <div className="flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={save}>{employee ? "Update" : "Add Employee"}</Btn>
      </div>
    </div>
  );
}

function StaffPage() {
  const db = useDB();
  const nav = useNavigate();
  const [tab, setTab] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | undefined>();

  const active = db.employees.filter((e) => e.status === "active");
  const inactive = db.employees.filter((e) => e.status === "inactive");
  const TABS = [
    { value: "all", label: "All Staff", count: db.employees.length },
    { value: "active", label: "Active", count: active.length },
    { value: "inactive", label: "Inactive", count: inactive.length },
  ];
  const base = { all: db.employees, active, inactive }[tab] ?? db.employees;
  const list = deptFilter === "all" ? base : base.filter((e) => e.department === deptFilter);

  const totalPayroll = active.reduce((s, e) => s + e.salary, 0);
  const deptCounts = DEPARTMENTS.reduce((acc, d) => { acc[d] = active.filter((e) => e.department === d).length; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff"
        subtitle={`${active.length} active · ${inactive.length} inactive`}
        actions={<Btn variant="primary" size="sm" icon={Plus} className="shimmer-gold font-semibold shadow-sm" onClick={() => nav({ to: "/hr/new" as never })}>Add Employee</Btn>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Staff" value={db.employees.length} />
        <StatCard label="Active" value={active.length} tone="success" />
        <StatCard label="Monthly Payroll" value={money(totalPayroll)} tone="primary" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
        <select className="h-8 rounded-md border border-border px-2 text-xs" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="all">All Departments</option>
          {DEPARTMENTS.filter((d) => deptCounts[d]! > 0).map((d) => <option key={d} value={d}>{d} ({deptCounts[d]})</option>)}
        </select>
      </div>

      <DataTable
        rows={list}
        searchKeys={["name", "department", "designation", "mobile"]}
        columns={[
          { key: "name", label: "Employee", render: (e) => (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{e.name[0]}</div>
              <div>
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.mobile}</div>
              </div>
            </div>
          )},
          { key: "department", label: "Department", render: (e) => <Badge tone="muted">{e.department}</Badge> },
          { key: "designation", label: "Designation" },
          { key: "joinDate", label: "Join Date" },
          { key: "salary", label: "Salary", align: "right", render: (e) => money(e.salary) },
          { key: "status", label: "Status", render: (e) => <Badge tone={e.status === "active" ? "success" : "muted"}>{e.status}</Badge> },
          { key: "actions", label: "", sortable: false, render: (e) => (
            <Btn size="sm" variant="ghost" onClick={(ev) => { ev.stopPropagation(); setEditEmp(e); setAddOpen(true); }}>Edit</Btn>
          )},
        ]}
        pageSize={20}
      />

      <Drawer
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditEmp(undefined); }}
        title={editEmp ? "Edit Employee" : "Add Employee"}
        subtitle="Staff directory records and payroll configuration"
        width="max-w-lg"
      >
        <EmployeeForm onClose={() => { setAddOpen(false); setEditEmp(undefined); }} employee={editEmp} />
      </Drawer>
    </div>
  );
}

