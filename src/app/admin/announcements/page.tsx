import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

async function requireAnnouncementAccess() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "PRINCIPAL"
  ) {
    redirect("/");
  }

  return session;
}

async function createAnnouncement(formData: FormData) {
  "use server";

  await requireAnnouncementAccess();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !content) {
    redirect("/admin/announcements?error=Title%20and%20content%20are%20required.");
  }

  await prisma.announcement.create({
    data: {
      title,
      content,
      published: false,
    },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/student");
  redirect("/admin/announcements?success=Announcement%20created.");
}

async function updateAnnouncement(formData: FormData) {
  "use server";

  await requireAnnouncementAccess();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!id || !title || !content) {
    redirect(
      "/admin/announcements?error=Announcement%20details%20are%20required.",
    );
  }

  await prisma.announcement.update({
    where: {
      id,
    },
    data: {
      title,
      content,
    },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/student");
  redirect("/admin/announcements?success=Announcement%20updated.");
}

async function toggleAnnouncement(formData: FormData) {
  "use server";

  await requireAnnouncementAccess();

  const id = String(formData.get("id") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "true";

  if (!id) {
    redirect("/admin/announcements?error=Invalid%20announcement.");
  }

  await prisma.announcement.update({
    where: {
      id,
    },
    data: {
      published: !published,
    },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/student");

  redirect(
    `/admin/announcements?success=${
      published
        ? "Announcement%20unpublished."
        : "Announcement%20published."
    }`,
  );
}

async function deleteAnnouncement(formData: FormData) {
  "use server";

  await requireAnnouncementAccess();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/admin/announcements?error=Invalid%20announcement.");
  }

  await prisma.announcement.delete({
    where: {
      id,
    },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/student");
  redirect("/admin/announcements?success=Announcement%20deleted.");
}

function formatDate(date: Date) {
  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAnnouncementAccess();

  const params = await searchParams;

  const announcements = await prisma.announcement.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-medium text-gray-500">
            School Communication
          </p>

          <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                Announcements
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create and manage announcements shown to students.
              </p>
            </div>

            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        {params.error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {params.error}
          </div>
        ) : null}

        {params.success ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {params.success}
          </div>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-base font-bold text-gray-950">
              Create Announcement
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              New announcements are saved as drafts until you publish them.
            </p>
          </div>

          <form action={createAnnouncement} className="space-y-5 p-6">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Announcement Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={200}
                placeholder="e.g. Resumption Date for Second Term"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Announcement
              </label>

              <textarea
                id="content"
                name="content"
                required
                rows={6}
                placeholder="Write the announcement students should see..."
                className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Create Announcement
              </button>
            </div>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-base font-bold text-gray-950">
              Existing Announcements
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Published announcements are visible on the student dashboard.
            </p>
          </div>

          {announcements.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-700">
                No announcements yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Create your first school announcement above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="p-6">
                  <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                            announcement.published
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {announcement.published
                            ? "Published"
                            : "Draft"}
                        </span>

                        <span className="text-xs text-gray-400">
                          Created {formatDate(announcement.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form action={updateAnnouncement} className="space-y-4">
                    <input
                      type="hidden"
                      name="id"
                      value={announcement.id}
                    />

                    <div>
                      <label
                        htmlFor={`title-${announcement.id}`}
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400"
                      >
                        Title
                      </label>

                      <input
                        id={`title-${announcement.id}`}
                        name="title"
                        type="text"
                        required
                        maxLength={200}
                        defaultValue={announcement.title}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`content-${announcement.id}`}
                        className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400"
                      >
                        Content
                      </label>

                      <textarea
                        id={`content-${announcement.id}`}
                        name="content"
                        required
                        rows={5}
                        defaultValue={announcement.content}
                        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={toggleAnnouncement}>
                      <input
                        type="hidden"
                        name="id"
                        value={announcement.id}
                      />

                      <input
                        type="hidden"
                        name="published"
                        value={String(announcement.published)}
                      />

                      <button
                        type="submit"
                        className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                          announcement.published
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {announcement.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                    </form>

                    <form action={deleteAnnouncement}>
                      <input
                        type="hidden"
                        name="id"
                        value={announcement.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}