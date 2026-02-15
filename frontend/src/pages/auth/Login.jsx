import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Temporary login logic (replace with real auth later)
    // You can later call backend API here

    navigate("/registry"); // default redirect for now
  };

  return (
    <div className="min-h-screen flex bg-background-light">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden">
        
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b14] via-[#1f3a2c] to-primary/30"></div>

        <div className="relative z-10 flex flex-col h-full justify-between text-white">

          {/* Updated Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <span className="material-symbols-outlined text-black">
                eco
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Infosys SAFc Platform
            </h2>
          </div>

          <div>
            <h1 className="text-4xl font-black leading-tight mb-6">
              Accelerating Sustainable Aviation Fuel Transparency
            </h1>
            <p className="text-white/80 leading-relaxed">
              Enterprise-grade blockchain registry for SAF certification,
              transfer, retirement and compliance reporting.
            </p>
          </div>

          <div className="flex gap-6 text-sm font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                verified
              </span>
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                eco
              </span>
              <span>Carbon Verified</span>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-10 bg-white">

        <div className="w-full max-w-md">

          <div className="mb-8">
            <h2 className="text-3xl font-black mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500">
              Log in to access the SAFc platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Corporate Email
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                className="w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Remember */}
            <div className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-600">
                Remember this device
              </span>
            </div>

            {/* Updated Button Text */}
            <button
              type="submit"
              className="w-full h-12 bg-primary font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Sign In
              <span className="material-symbols-outlined">
                arrow_forward
              </span>
            </button>

          </form>

        </div>
      </div>

    </div>
  );
}
