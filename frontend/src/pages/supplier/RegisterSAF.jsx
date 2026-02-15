import { useState } from "react";

export default function RegisterSAF({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const initialFormState = {
    // Step 1 - PO
    poNumber: "",
    producer: "",
    blendingRatio: "",
    feedstock: "",
    pathway: "",
    city: "",
    state: "",
    country: "",
    pincode: "",

    // Step 2 - SO
    soNumber: "",
    buyer: "",
    quantity: "",
    soCountry: "",
    soState: "",
    soCity: "",
    soZip: "",

    // Step 3 - Docs
    documents: []
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      documents: [...e.target.files]
    });
  };

  const submitForReview = async () => {
    try {
      setLoading(true);

      await fetch("http://localhost:5000/api/register-saf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "SUBMITTED"
        })
      });

      alert("Batch submitted for Inspector Review ✅");

      // Reset form
      setFormData(initialFormState);
      setStep(1);

      // Close modal if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error("Submission failed:", error);
      alert("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl p-8">

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold">
            <span className={step >= 1 ? "text-green-500" : ""}>
              1. PO Details
            </span>
            <span className={step >= 2 ? "text-green-500" : ""}>
              2. SO Details
            </span>
            <span className={step >= 3 ? "text-green-500" : ""}>
              3. Documents
            </span>
          </div>

          <div className="h-2 bg-gray-200 mt-2 rounded">
            <div
              className="h-full bg-green-500 rounded transition-all duration-300"
              style={{ width: `${step * 33}%` }}
            />
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Step 1: PO Details
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Input label="PO Number" name="poNumber" onChange={handleChange} />
              <Input label="SAF Producer" name="producer" onChange={handleChange} />
              <Input label="Blending Ratio (%)" name="blendingRatio" type="number" onChange={handleChange} />
              <Input label="Feedstock" name="feedstock" onChange={handleChange} />
              <Input label="SAF Pathway" name="pathway" onChange={handleChange} />
              <Input label="City" name="city" onChange={handleChange} />
              <Input label="State" name="state" onChange={handleChange} />
              <Input label="Country" name="country" onChange={handleChange} />
              <Input label="Pincode" name="pincode" onChange={handleChange} />
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setStep(2)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold"
              >
                Continue to SO →
              </button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Step 2: SO Details
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Input label="SO Number" name="soNumber" onChange={handleChange} />
              <Input label="Buyer" name="buyer" onChange={handleChange} />
              <Input label="Quantity (MT)" name="quantity" type="number" onChange={handleChange} />
              <Input label="Country" name="soCountry" onChange={handleChange} />
              <Input label="State" name="soState" onChange={handleChange} />
              <Input label="City" name="soCity" onChange={handleChange} />
              <Input label="ZIP Code" name="soZip" onChange={handleChange} />
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 font-bold"
              >
                ← Back
              </button>

              <button
                onClick={() => setStep(3)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold"
              >
                Continue to Documents →
              </button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Step 3: Document Upload
            </h2>

            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="mb-6"
            />

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="text-gray-600 font-bold"
              >
                ← Back
              </button>

              <button
                onClick={submitForReview}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-bold text-white ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Submitting..." : "Submit for Inspector Review"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

/* Reusable Input */
function Input({ label, name, type = "text", onChange }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-bold mb-1">{label}</label>
      <input
        name={name}
        type={type}
        onChange={onChange}
        className="border rounded-lg p-3 focus:ring-2 focus:ring-green-400"
      />
    </div>
  );
}
