import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-center gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>© 2025 Web Programming Hack Blog All right reserved.</span>
        </div>
      </div>
    </footer>
  );
}
