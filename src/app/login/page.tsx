import Image from "next/image"
import { GalleryVerticalEnd } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Redlines Inc.
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <Image
            src="/EngineersReviewing.png"
            alt="Engineers reviewing design documents"
            fill
            priority
            className="object-cover dark:brightness-[0.2] dark:grayscale"
            sizes="50vw"
          />
        </div>


      </div>
      {/* Hero About Section */}
      <div className="w-full py-16 px-6 md:px-10">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-2 min-h-[400px]">
              {/* Left side - About text */}
              <div className="flex flex-col justify-center items-center text-center p-8 lg:p-12">
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">What is Redlines?</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  The only review tool built exclusively for design reviews.
                  Built for engineers, architects, construction contractors, and clients.
                </p>
                <p className="text-xl font-semibold text-primary">
                  No fluff. Just the best reviews done as fast as possible.
                </p>
              </div>

              {/* Right side - Image */}
              <div className="relative bg-muted min-h-[300px] lg:min-h-full">
                <Image
                  src="/hero-plan.png"
                  alt="Artistic building plan with redline annotations"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                  priority
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  )
}
