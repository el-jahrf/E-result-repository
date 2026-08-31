const navigation = [
  { name: "Dashboard", icon: "⌂", active: true },
  { name: "Students", icon: "♙" },
  { name: "Teachers", icon: "♙" },
  { name: "Classes", icon: "▦" },
  { name: "Subjects", icon: "▤" },
  { name: "Results", icon: "✓" },
  { name: "Academic Sessions", icon: "◷" },
  { name: "Assignments", icon: "□" },
];

const stats = [
  { label: "Total Students", value: "1,248", change: "+8.2%" },
  { label: "Active Teachers", value: "86", change: "+4.1%" },
  { label: "Classes", value: "42", change: "+2.4%" },
  { label: "Published Results", value: "1,104", change: "+12.6%" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-gray-100 px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-950">
                E-RESULT
              </h1>
              <p className="text-xs text-gray-500">School Management</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item) => (
              <div
                key={item.name}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  item.active
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="w-5 text-center text-base">{item.icon}</span>
                {item.name}
              </div>
            ))}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">CURRENT SESSION</p>
              <p className="mt-1 text-sm font-semibold">2025/2026</p>
              <p className="mt-1 text-xs text-gray-500">Second Term</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-6 lg:px-10">
            <div>
              <p className="text-sm text-gray-500">Welcome back,</p>
              <h2 className="text-lg font-semibold">Administrator</h2>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600">
                ♢
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  AD
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold">Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 lg:p-10">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8">
                <p className="text-sm font-medium text-gray-500">
                  Monday, August 31, 2026
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">
                  Dashboard
                </h1>
                <p className="mt-2 text-gray-500">
                  Overview of your school&apos;s academic activities.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <p className="text-sm font-medium text-gray-500">
                      {stat.label}
                    </p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-3xl font-bold tracking-tight">
                        {stat.value}
                      </p>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Result Performance</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Overall class performance rate
                      </p>
                    </div>
                    <span className="text-2xl font-bold">78.4%</span>
                  </div>

                  <div className="mt-8 h-3 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-[78.4%] rounded-full bg-gray-900" />
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold">82.1%</p>
                      <p className="text-xs text-gray-500">JSS Classes</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">76.8%</p>
                      <p className="text-xs text-gray-500">SS Classes</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">78.4%</p>
                      <p className="text-xs text-gray-500">School Average</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="font-semibold">Recent Activity</h3>
                  <div className="mt-5 space-y-5">
                    {[
                      ["Results submitted", "SS 2A • Mathematics", "12 min ago"],
                      ["New student added", "JSS 1B", "38 min ago"],
                      ["Result approved", "JSS 3A • Second Term", "1 hr ago"],
                      ["Teacher assigned", "SS 1B • Physics", "2 hrs ago"],
                    ].map(([title, detail, time]) => (
                      <div key={`${title}-${time}`} className="flex gap-3">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gray-900" />
                        <div>
                          <p className="text-sm font-medium">{title}</p>
                          <p className="text-xs text-gray-500">{detail}</p>
                          <p className="mt-1 text-[11px] text-gray-400">{time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold">Result Management</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Monitor result entry and approval progress.
                    </p>
                  </div>

                  <button className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700">
                    Manage Results →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}