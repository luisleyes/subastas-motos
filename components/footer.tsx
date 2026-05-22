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
        </div>

        {/* Empresa */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">
            Empresa
          </h3>

          <ul className="space-y-3 text-sm text-white/70">
            <li>
              <a href="/quienes-somos" className="hover:text-white transition">
                Quiénes somos
              </a>
            </li>

            <li>
              <a href="/contacto" className="hover:text-white transition">
                Contacto
              </a>
            </li>

            <li>
              <a href="/blog" className="hover:text-white transition">
                Blog
              </a>
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
              <a href="/terminos" className="hover:text-white transition">
                Términos y condiciones
              </a>
            </li>

            <li>
              <a href="/privacidad" className="hover:text-white transition">
                Política de privacidad
              </a>
            </li>

            <li>
              <a href="/cookies" className="hover:text-white transition">
                Política de cookies
              </a>
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
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-white/50">
          © 2026 Subastas Motos. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}