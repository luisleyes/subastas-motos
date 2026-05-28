import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Marca */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Subastas Motos
          </h2>

          <p className="text-white/70 text-sm leading-relaxed">
            Plataforma especializada en subastas y publicación de motos en Colombia.
          </p>

          <div className="mt-6 space-y-2 text-sm text-white/60">
            <p>🔒 Pagos protegidos</p>
            <p>✔ Usuarios verificados</p>
            <p>🔥 Subastas en tiempo real</p>
          </div>
        </div>

        {/* Empresa */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">
            Empresa
          </h3>

          <ul className="space-y-3 text-sm text-white/70">

            <li>
              <Link
                href="/quienes-somos"
                className="hover:text-white transition"
              >
                Quiénes somos
              </Link>
            </li>

            <li>
              <Link
                href="/contacto"
                className="hover:text-white transition"
              >
                Contacto
              </Link>
            </li>

            <li>
              <Link
                href="/blog"
                className="hover:text-white transition"
              >
                Blog
              </Link>
            </li>

          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">
            Legal
          </h3>

          <ul className="space-y-3 text-sm text-white/70">

            <li>
              <Link
                href="/terminos"
                className="hover:text-white transition"
              >
                Términos y condiciones
              </Link>
            </li>

            <li>
              <Link
                href="/privacidad"
                className="hover:text-white transition"
              >
                Política de privacidad
              </Link>
            </li>

            <li>
              <Link
                href="/cookies"
                className="hover:text-white transition"
              >
                Política de cookies
              </Link>
            </li>

          </ul>
        </div>

        {/* Soporte */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">
            Soporte
          </h3>

          <ul className="space-y-3 text-sm text-white/70">

            <li>
              <a
                href="https://wa.me/573017170878"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                WhatsApp
              </a>
            </li>

            <li>
              <a
                href="mailto:contacto@subastasmotos.com"
                className="hover:text-white transition"
              >
                contacto@subastasmotos.com
              </a>
            </li>

            <li className="pt-2 text-white/50">
              Atención en Colombia
            </li>

          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">

          <p>
            © 2026 Subastas Motos. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-4">

            <Link
              href="/terminos"
              className="hover:text-white transition"
            >
              Términos
            </Link>

            <Link
              href="/privacidad"
              className="hover:text-white transition"
            >
              Privacidad
            </Link>

            <Link
              href="/cookies"
              className="hover:text-white transition"
            >
              Cookies
            </Link>

          </div>
        </div>
      </div>
    </footer>
  );
}