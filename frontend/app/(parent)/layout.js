import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function ParentLayout({ children }) {
  return (
    <>
      <Sidebar role="parent" />
      <Topbar role="parent" />
      <main className="ml-[260px] pt-16 w-[calc(100%-260px)] min-h-screen max-md:ml-0 max-md:w-full">
        <div className="max-w-[1200px] mx-auto px-8 py-8 pb-12 max-md:px-4">{children}</div>
      </main>
    </>
  );
}
