"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

interface Filial {
  id: string
  nome: string
  codigo: string
}

export default function LoginPage() {
  const [userType, setUserType] = useState("")
  const [filial, setFilial] = useState("")
  const [filiais, setFiliais] = useState<Filial[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchFiliais()
  }, [])

  const fetchFiliais = async () => {
    try {
      const { data, error } = await supabase.from("filiais").select("id, nome, codigo").order("nome")

      if (error) {
        // Se as tabelas não existem ainda, usar dados mock
        console.warn("Tabelas não encontradas, usando dados mock:", error.message)
        setFiliais([
          { id: "1", nome: "São Paulo - Centro", codigo: "sp-centro" },
          { id: "2", nome: "Rio de Janeiro - Copacabana", codigo: "rj-copacabana" },
          { id: "3", nome: "Belo Horizonte - Centro", codigo: "mg-centro" },
          { id: "4", nome: "Porto Alegre - Centro", codigo: "rs-centro" },
        ])
      } else {
        setFiliais(data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar filiais:", error)
      // Fallback para dados mock em caso de erro
      setFiliais([
        { id: "1", nome: "São Paulo - Centro", codigo: "sp-centro" },
        { id: "2", nome: "Rio de Janeiro - Copacabana", codigo: "rj-copacabana" },
        { id: "3", nome: "Belo Horizonte - Centro", codigo: "mg-centro" },
        { id: "4", nome: "Porto Alegre - Centro", codigo: "rs-centro" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    if (userType === "filial" && filial) {
      router.push(`/filial?branch=${filial}`)
    } else if (userType === "admin") {
      router.push("/admin")
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md glass-effect border-white/20 shadow-2xl animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-lg">
              <Image
                src="/logo.png"
                alt="Logo da Empresa"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              Sistema de Gestão
            </CardTitle>
            <CardDescription className="text-white/80 text-base">Pedidos de Materiais por Filial</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userType" className="text-white font-medium">
              Tipo de Usuário
            </Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/60">
                <SelectValue placeholder="Selecione o tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filial">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary-600" />
                    <span>Filial</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary-600" />
                    <span>Administração</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userType === "filial" && (
            <div className="space-y-2 animate-slide-in">
              <Label htmlFor="filial" className="text-white font-medium">
                Filial
              </Label>
              <Select value={filial} onValueChange={setFilial} disabled={loading}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/60">
                  <SelectValue placeholder={loading ? "Carregando..." : "Selecione sua filial"} />
                </SelectTrigger>
                <SelectContent>
                  {filiais.map((f) => (
                    <SelectItem key={f.id} value={f.codigo}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleLogin}
            className="w-full bg-white text-primary-700 hover:bg-white/90 font-semibold py-3 shadow-lg transition-all duration-200 transform hover:scale-105"
            disabled={!userType || (userType === "filial" && !filial) || loading}
          >
            Acessar Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
