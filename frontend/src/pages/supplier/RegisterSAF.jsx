import { useMemo, useState } from "react";

const alphaOnly = /^[a-zA-Z ]+$/;
const producerPattern = /^[a-zA-Z0-9 ]+$/;
const decimalPattern = /^\d+(\.\d+)?$/;
const numericPattern = /^\d+$/;
const soNumberPattern = /^[a-zA-Z0-9]+$/;
const zipcodePattern = /^[a-zA-Z0-9 ]+$/;

const initialFormState = {
  poNumber: "",
  producer: "",
  blendingRatio: "",
  feedstock: "",
  pathway: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  soNumber: "",
  buyer: "",
  quantity: "",
  soCountry: "",
  soState: "",
  soCity: "",
  soZip: "",
  documents: [],
};

const backendToFormFieldMap = {
  productionBatchId: "poNumber",
  producer: "producer",
  blendingRatio: "blendingRatio",
  feedstockType: "feedstock",
  productionPathway: "pathway",
  productionLocationCity: "city",
  productionLocationState: "state",
  productionLocationCountry: "country",
  productionLocationPincode: "pincode",
  soNumber: "soNumber",
  buyer: "buyer",
  quantity: "quantity",
  deliveryCountry: "soCountry",
  deliveryState: "soState",
  deliveryCity: "soCity",
  deliveryZipcode: "soZip",
};

export default function RegisterSAF({ onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const stepFields = useMemo(
    () => ({
      1: ["poNumber", "producer", "blendingRatio", "feedstock", "pathway", "city", "state", "country", "pincode"],
      2: ["soNumber", "buyer", "quantity", "soCountry", "soState", "soCity", "soZip"],
      3: [],
    }),
    []
  );

  const getFieldError = (field, value) => {
    const v = String(value || "").trim();
    if (!v) {
      return "This field is required.";
    }

    switch (field) {
      case "producer":
        if (!producerPattern.test(v)) return "SAF Producer must be alphanumeric only.";
        return "";
      case "blendingRatio":
        if (!decimalPattern.test(v) || Number(v) <= 0) return "Blending ratio must be numeric and greater than 0.";
        return "";
      case "feedstock":
      case "pathway":
      case "city":
      case "state":
      case "country":
      case "buyer":
      case "soCountry":
      case "soState":
      case "soCity":
        if (!alphaOnly.test(v)) return "Only letters and spaces are allowed.";
        return "";
      case "pincode":
        if (!numericPattern.test(v)) return "Pincode must be numeric only.";
        return "";
      case "soNumber":
        if (!soNumberPattern.test(v)) return "SO Number must be alphanumeric with no special characters.";
        return "";
      case "quantity":
        if (!decimalPattern.test(v) || Number(v) <= 0) return "Quantity must be numeric and greater than 0.";
        return "";
      case "soZip":
        if (!zipcodePattern.test(v)) return "Zipcode must be alphanumeric.";
        return "";
      default:
        return "";
    }
  };

  const validateFields = (fields) => {
    const nextErrors = {};
    fields.forEach((field) => {
      const error = getFieldError(field, formData[field]);
      if (error) {
        nextErrors[field] = error;
      }
    });
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (event) => {
    setFormData((prev) => ({ ...prev, documents: [...event.target.files] }));
  };

  const goToStep = (targetStep) => {
    const fieldsToValidate = stepFields[step] || [];
    if (!validateFields(fieldsToValidate)) {
      setServerError("Please fix the highlighted fields before continuing.");
      return;
    }
    setServerError("");
    setStep(targetStep);
  };

  const submitForReview = async () => {
    const allFields = [...stepFields[1], ...stepFields[2]];
    if (!validateFields(allFields)) {
      setServerError("All fields are mandatory and must be valid before submission.");
      return;
    }

    try {
      setLoading(true);
      setServerError("");

      const response = await fetch("http://localhost:5000/api/saf/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productionBatchId: formData.poNumber.trim(),
          productionDate: new Date().toISOString().split("T")[0],
          producer: formData.producer.trim(),
          blendingRatio: formData.blendingRatio.trim(),
          quantity: formData.quantity.trim(),
          feedstockType: formData.feedstock.trim(),
          carbonIntensity: formData.blendingRatio.trim(),
          productionPathway: formData.pathway.trim(),
          productionLocationCity: formData.city.trim(),
          productionLocationState: formData.state.trim(),
          productionLocationCountry: formData.country.trim(),
          productionLocationPincode: formData.pincode.trim(),
          soNumber: formData.soNumber.trim(),
          buyer: formData.buyer.trim(),
          deliveryCountry: formData.soCountry.trim(),
          deliveryState: formData.soState.trim(),
          deliveryCity: formData.soCity.trim(),
          deliveryZipcode: formData.soZip.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        const mappedFieldErrors = Object.entries(result.fieldErrors || {}).reduce((acc, [key, value]) => {
          acc[backendToFormFieldMap[key] || key] = value;
          return acc;
        }, {});
        setErrors((prev) => ({ ...prev, ...mappedFieldErrors }));
        throw new Error(result.error || "Something went wrong");
      }

      alert("Batch submitted for Inspector Review.");
      setFormData(initialFormState);
      setErrors({});
      setStep(1);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setServerError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl p-8">
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold">
            <span className={step >= 1 ? "text-green-500" : ""}>1. PO Details</span>
            <span className={step >= 2 ? "text-green-500" : ""}>2. SO Details</span>
            <span className={step >= 3 ? "text-green-500" : ""}>3. Documents</span>
          </div>
          <div className="h-2 bg-gray-200 mt-2 rounded">
            <div className="h-full bg-green-500 rounded transition-all duration-300" style={{ width: `${step * 33}%` }} />
          </div>
        </div>

        {serverError && <p className="mb-4 text-sm text-red-600">{serverError}</p>}

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Step 1: PO Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="PO Number" name="poNumber" value={formData.poNumber} onChange={handleChange} error={errors.poNumber} />
              <Input label="SAF Producer" name="producer" value={formData.producer} onChange={handleChange} error={errors.producer} />
              <Input label="Blending Ratio (%)" name="blendingRatio" value={formData.blendingRatio} onChange={handleChange} error={errors.blendingRatio} />
              <Input label="Feedstock" name="feedstock" value={formData.feedstock} onChange={handleChange} error={errors.feedstock} />
              <Input label="SAF Pathway" name="pathway" value={formData.pathway} onChange={handleChange} error={errors.pathway} />
              <Input label="City" name="city" value={formData.city} onChange={handleChange} error={errors.city} />
              <Input label="State" name="state" value={formData.state} onChange={handleChange} error={errors.state} />
              <Input label="Country" name="country" value={formData.country} onChange={handleChange} error={errors.country} />
              <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} error={errors.pincode} />
            </div>
            <div className="mt-6 text-right">
              <button onClick={() => goToStep(2)} className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold">
                Continue to SO
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Step 2: SO Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="SO Number" name="soNumber" value={formData.soNumber} onChange={handleChange} error={errors.soNumber} />
              <Input label="Buyer" name="buyer" value={formData.buyer} onChange={handleChange} error={errors.buyer} />
              <Input label="Quantity (MT)" name="quantity" value={formData.quantity} onChange={handleChange} error={errors.quantity} />
              <Input label="Country" name="soCountry" value={formData.soCountry} onChange={handleChange} error={errors.soCountry} />
              <Input label="State" name="soState" value={formData.soState} onChange={handleChange} error={errors.soState} />
              <Input label="City" name="soCity" value={formData.soCity} onChange={handleChange} error={errors.soCity} />
              <Input label="ZIP Code" name="soZip" value={formData.soZip} onChange={handleChange} error={errors.soZip} />
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="text-gray-600 font-bold">Back</button>
              <button onClick={() => goToStep(3)} className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold">
                Continue to Documents
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Step 3: Document Upload</h2>
            <input type="file" multiple onChange={handleFileChange} className="mb-6" />
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-600 font-bold">Back</button>
              <button
                onClick={submitForReview}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-bold text-white ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
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

function Input({ label, name, value, onChange, error }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-bold mb-1">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className={`border rounded-lg p-3 focus:ring-2 focus:ring-green-400 ${error ? "border-red-400" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
