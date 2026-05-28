"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
  Upload,
  Loader2,
  ShieldCheck,
  Camera,
  X,
  MapPin,
  Calendar,
  Gauge,
  DollarSign,
  Hash,
  FileText,
  Building2,
  User,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PublicarPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [previewPrice, setPreviewPrice] = useState("");

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: "",
    mileage: "",
    city: "",
    basePrice: "",
    plate: "",
    description: "",
    sellerName: "",
    sellerPhone: "",
    sellerWhatsapp: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lista de ciudades colombianas
  const colombianCities = [
    "Bogotá D.C.", "Medellín", "Cali", "Barranquilla", "Cartagena",
    "Bucaramanga", "Pereira", "Santa Marta", "Ibagué", "Manizales",
    "Villavicencio", "Cúcuta", "Neiva", "Pasto", "Armenia", "Sincelejo"
  ];

  // Generar años (1900 hasta año actual + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 2 }, (_, i) => currentYear + 1 - i);

  // Verificar sesión
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, []);

  // Formatear precio en tiempo real
  useEffect(() => {
    if (formData.basePrice) {
      const num = parseInt(formData.basePrice);
      if (!isNaN(num)) {
        setPreviewPrice(num.toLocaleString());
      } else {
        setPreviewPrice("");
      }
    } else {
      setPreviewPrice("");
    }
  }, [formData.basePrice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Limpiar error del campo cuando se edita
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("❌ La imagen supera los 5MB");
      return;
    }

    if (!file.type.includes("png") && !file.type.includes("jpg") && !file.type.includes("jpeg")) {
      alert("❌ Formato inválido. Solo PNG, JPG o JPEG");
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand) newErrors.brand = "La marca es obligatoria";
    if (!formData.model) newErrors.model = "El modelo es obligatorio";
    if (!formData.year) newErrors.year = "El año es obligatorio";
    if (!formData.mileage) newErrors.mileage = "El kilometraje es obligatorio";
    if (!formData.city) newErrors.city = "La ciudad es obligatoria";
    if (!formData.basePrice) newErrors.basePrice = "El precio base es obligatorio";
    if (!formData.plate) newErrors.plate = "La placa es obligatoria";
    if (!formData.description) newErrors.description = "La descripción es obligatoria";
    if (!formData.sellerName) newErrors.sellerName = "El nombre del vendedor es obligatorio";
    if (!formData.sellerPhone) newErrors.sellerPhone = "El teléfono es obligatorio";
    if (!formData.sellerWhatsapp) newErrors.sellerWhatsapp = "El WhatsApp es obligatorio";
    if (!image) newErrors.image = "Debes subir una imagen de la moto";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      alert("❌ Por favor, completa todos los campos obligatorios");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Debes iniciar sesión");
        router.push("/login");
        return;
      }

      // Subir imagen
      const fileName = `${Date.now()}-${image!.name}`;
      const { error: uploadError } = await supabase.storage
        .from("motos")
        .upload(fileName, image!, {
          cacheControl: "3600",
          upsert: false,
          contentType: image!.type,
        });

      if (uploadError) {
        console.log(uploadError);
        alert(`❌ Error subiendo imagen: ${uploadError.message}`);
        return;
      }

      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/motos/${fileName}`;

      // Guardar en base de datos con los nuevos campos
      const { error: insertError } = await supabase.from("motorcycles").insert([
        {
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year),
          mileage: parseInt(formData.mileage),
          city: formData.city,
          base_price: parseInt(formData.basePrice),
          description: formData.description,
          image_url: imageUrl,
          plate: formData.plate.toUpperCase(),
          verified: false,
          approved: false,
          auction_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          user_email: session.user.email,
          user_id: session.user.id,
          // Nuevos campos de contacto
          seller_name: formData.sellerName,
          seller_phone: formData.sellerPhone,
          seller_whatsapp: formData.sellerWhatsapp,
        },
      ]);

      if (insertError) {
        console.log(insertError);
        alert(`❌ Error guardando: ${insertError.message}`);
        return;
      }

      alert("🔥 ¡Moto publicada exitosamente! Espera la aprobación del admin.");
      router.push("/");

    } catch (error) {
      console.log(error);
      alert("❌ Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-400">Publicación verificada</span>
          </div>
          <h1 className="text-6xl font-black tracking-tight">
            Publicar
            <span className="block bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              nueva moto
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            Completa toda la información para generar confianza y atraer más pujas.
            Tus datos de contacto permanecerán privados hasta que un comprador desbloquee el acceso.
          </p>
        </motion.div>

        {/* FORM */}
        <div className="grid gap-6">
          {/* INFORMACIÓN DE LA MOTO */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
            <h2 className="mb-6 text-2xl font-black text-orange-500">Información de la moto</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Marca */}
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Marca *"
                  className={`w-full rounded-2xl border ${errors.brand ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition`}
                />
                {errors.brand && <p className="mt-1 text-xs text-red-400">{errors.brand}</p>}
              </div>

              {/* Modelo */}
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="Modelo *"
                  className={`w-full rounded-2xl border ${errors.model ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition`}
                />
                {errors.model && <p className="mt-1 text-xs text-red-400">{errors.model}</p>}
              </div>

              {/* Año */}
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border ${errors.year ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer`}
                >
                  <option value="">Año *</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.year && <p className="mt-1 text-xs text-red-400">{errors.year}</p>}
              </div>

              {/* Kilometraje */}
              <div className="relative">
                <Gauge className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  placeholder="Kilometraje *"
                  type="number"
                  className={`w-full rounded-2xl border ${errors.mileage ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition`}
                />
                {errors.mileage && <p className="mt-1 text-xs text-red-400">{errors.mileage}</p>}
              </div>

              {/* Ciudad */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border ${errors.city ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none appearance-none cursor-pointer`}
                >
                  <option value="">Ciudad *</option>
                  {colombianCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
              </div>

              {/* Precio Base */}
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleChange}
                  placeholder="Precio Base (COP) *"
                  type="number"
                  className={`w-full rounded-2xl border ${errors.basePrice ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition`}
                />
                {previewPrice && (
                  <p className="mt-1 text-xs text-green-500">≈ ${previewPrice} COP</p>
                )}
                {errors.basePrice && <p className="mt-1 text-xs text-red-400">{errors.basePrice}</p>}
              </div>

              {/* Placa */}
              <div className="relative md:col-span-2">
                <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="plate"
                  value={formData.plate}
                  onChange={handleChange}
                  placeholder="Placa * (Ej: ABC123)"
                  className={`w-full rounded-2xl border ${errors.plate ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition uppercase`}
                />
                {errors.plate && <p className="mt-1 text-xs text-red-400">{errors.plate}</p>}
              </div>
            </div>
          </div>

          {/* INFORMACIÓN DE CONTACTO DEL VENDEDOR (PRIVADA) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
            <h2 className="mb-6 text-2xl font-black text-orange-500">Información de contacto</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Esta información NO será visible públicamente. Solo se mostrará a compradores que paguen por desbloquear el contacto.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nombre del vendedor */}
              <div className="relative md:col-span-2">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="sellerName"
                  value={formData.sellerName}
                  onChange={handleChange}
                  placeholder="Nombre del vendedor *"
                  className={`w-full rounded-2xl border ${errors.sellerName ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition`}
                />
                {errors.sellerName && <p className="mt-1 text-xs text-red-400">{errors.sellerName}</p>}
              </div>

              {/* Teléfono */}
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="sellerPhone"
                  value={formData.sellerPhone}
                  onChange={handleChange}
                  placeholder="Teléfono de contacto * (Ej: 3001234567)"
                  type="tel"
                  className={`w-full rounded-2xl border ${errors.sellerPhone ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition`}
                />
                {errors.sellerPhone && <p className="mt-1 text-xs text-red-400">{errors.sellerPhone}</p>}
              </div>

              {/* WhatsApp */}
              <div className="relative">
                <MessageCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                <input
                  name="sellerWhatsapp"
                  value={formData.sellerWhatsapp}
                  onChange={handleChange}
                  placeholder="WhatsApp * (Ej: 573001234567)"
                  type="tel"
                  className={`w-full rounded-2xl border ${errors.sellerWhatsapp ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 focus:border-orange-500 focus:outline-none transition`}
                />
                {errors.sellerWhatsapp && <p className="mt-1 text-xs text-red-400">{errors.sellerWhatsapp}</p>}
              </div>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
            <h2 className="mb-6 text-2xl font-black text-orange-500">Descripción de la moto</h2>
            <div className="relative">
              <FileText className="absolute left-4 top-5 h-5 w-5 text-zinc-500" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detalles mecánicos, peritaje, observaciones, estado general... *"
                rows={6}
                className={`w-full rounded-2xl border ${errors.description ? 'border-red-500' : 'border-zinc-800'} bg-black pl-12 pr-4 py-4 resize-none focus:border-orange-500 focus:outline-none transition`}
              />
              {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
            </div>
          </div>

          {/* SUBIR IMAGEN */}
          <div className={`rounded-3xl border-2 border-dashed p-10 text-center transition-all ${imagePreview ? "border-orange-500" : "border-zinc-800"} ${errors.image ? 'border-red-500' : ''} bg-zinc-950/50`}>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="mx-auto max-h-96 rounded-2xl" />
                <button
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-sm font-bold hover:bg-red-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Camera className="mx-auto h-14 w-14 text-zinc-600" />
                <p className="mt-4 text-lg text-zinc-300">Sube fotos reales de la moto</p>
                <p className="mt-2 text-sm text-zinc-600">PNG / JPG / JPEG • máximo 5MB</p>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
            <label
              htmlFor="image-upload"
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-black text-black transition hover:bg-orange-400"
            >
              <Upload className="h-5 w-5" />
              {imagePreview ? "Cambiar imagen" : "Seleccionar imagen"}
            </label>
            {errors.image && <p className="mt-2 text-sm text-red-400">{errors.image}</p>}
          </div>

          {/* BOTÓN PUBLICAR */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePublish}
            disabled={isLoading}
            className="rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 py-5 text-xl font-black text-black shadow-lg shadow-orange-500/20 transition hover:from-orange-400 hover:to-orange-500 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : "🚀 PUBLICAR SUBASTA"}
          </motion.button>
        </div>
      </div>
    </main>
  );
}