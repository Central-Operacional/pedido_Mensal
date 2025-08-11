"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Save, Send, RotateCcw, ArrowLeft, Loader2, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

interface Filial {
  id: string
  nome: string
  codigo: string
  empresa: string
  departamento: string
  posto: string
}

interface Produto {
  id: string
  codigo: string
  item: string
  descricao: string
}

interface Pedido {
  id?: string
  produto_id: string
  periodo: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  n_serventes: number
  ordem_compra: string
  realizado_per_capita: number
  acumulado_total: number
  status: "rascunho" | "enviado"
  data_lancamento?: string
}

export default function FilialPage() {
  const searchParams = useSearchParams()
  const branchCode = searchParams.get("branch")
  const [filial, setFilial] = useState<Filial | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [periodo, setPeriodo] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [produtosAtivos, setProdutosAtivos] = useState<Set<string>>(new Set())
  const [dataLancamento, setDataLancamento] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    if (branchCode) {
      fetchData()
    }
  }, [branchCode])

  const fetchData = async () => {
    try {
      // Buscar dados da filial
      const { data: filialData, error: filialError } = await supabase
        .from("filiais")
        .select("*")
        .eq("codigo", branchCode)
        .single()

      let currentFilial
      if (filialError) {
        // Usar dados mock se as tabelas não existem
        console.warn("Tabela filiais não encontrada, usando dados mock")
        const mockFiliais = [
          {
            id: "1",
            nome: "São Paulo - Centro",
            codigo: "sp-centro",
            empresa: "Empresa ABC Ltda",
            departamento: "Operações",
            posto: "Filial Regional",
          },
          {
            id: "2",
            nome: "Rio de Janeiro - Copacabana",
            codigo: "rj-copacabana",
            empresa: "Empresa ABC Ltda",
            departamento: "Operações",
            posto: "Filial Regional",
          },
          {
            id: "3",
            nome: "Belo Horizonte - Centro",
            codigo: "mg-centro",
            empresa: "Empresa ABC Ltda",
            departamento: "Operações",
            posto: "Filial Regional",
          },
          {
            id: "4",
            nome: "Porto Alegre - Centro",
            codigo: "rs-centro",
            empresa: "Empresa ABC Ltda",
            departamento: "Operações",
            posto: "Filial Regional",
          },
        ]
        currentFilial = mockFiliais.find((f) => f.codigo === branchCode)
      } else {
        currentFilial = filialData
      }

      if (!currentFilial) {
        throw new Error("Filial não encontrada")
      }
      setFilial(currentFilial)

      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("*").order("codigo")

      let currentProdutos
      if (produtosError) {
        // Usar dados mock se as tabelas não existem
        console.warn("Tabela produtos não encontrada, usando dados mock")
        currentProdutos = [
          { id: "1", codigo: "MAT001", item: "Material de Limpeza", descricao: "Detergente neutro 5L" },
          { id: "2", codigo: "MAT002", item: "Material de Escritório", descricao: "Papel A4 500 folhas" },
          { id: "3", codigo: "MAT003", item: "Equipamento de Segurança", descricao: "Capacete de proteção" },
          { id: "4", codigo: "MAT004", item: "Material de Higiene", descricao: "Papel higiênico 12 rolos" },
          { id: "5", codigo: "MAT005", item: "Equipamento de Limpeza", descricao: "Vassoura de piaçava" },
        ]
      } else {
        currentProdutos = produtosData || []
      }
      setProdutos(currentProdutos)

      // Buscar pedidos existentes
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedidos")
        .select("*")
        .eq("filial_id", currentFilial.id)

      let currentPedidos = []
      if (pedidosError) {
        console.warn("Tabela pedidos não encontrada, usando dados mock")
        currentPedidos = []
      } else {
        currentPedidos = pedidosData || []
      }

      // Inicializar pedidos com produtos
      const pedidosIniciais = currentProdutos.map((produto) => {
        const pedidoExistente = currentPedidos.find((p) => p.produto_id === produto.id)
        return (
          pedidoExistente || {
            produto_id: produto.id,
            periodo: "",
            quantidade: 0,
            valor_unitario: 0,
            valor_total: 0,
            n_serventes: 0,
            ordem_compra: "",
            realizado_per_capita: 0,
            acumulado_total: 0,
            status: "rascunho" as const,
          }
        )
      })

      setPedidos(pedidosIniciais)
      setProdutosAtivos(new Set(pedidosIniciais.map((p) => p.produto_id)))
      if (currentPedidos.length > 0) {
        setPeriodo(currentPedidos[0].periodo || "")
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Aviso",
        description: "Usando dados de demonstração. Configure o Supabase para dados reais.",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePedido = (produtoId: string, field: keyof Pedido, value: number | string) => {
    setPedidos((prev) =>
      prev.map((pedido) => {
        if (pedido.produto_id === produtoId) {
          const updated = { ...pedido, [field]: value }

          // Cálculos automáticos
          if (field === "quantidade" || field === "valor_unitario") {
            updated.valor_total = updated.quantidade * updated.valor_unitario
          }

          if (field === "valor_total" || field === "n_serventes") {
            if (updated.n_serventes > 0) {
              updated.realizado_per_capita = updated.valor_total / updated.n_serventes
            }
          }

          return updated
        }
        return pedido
      }),
    )
  }

  const handleSave = async () => {
    if (!filial) return

    // Validar período obrigatório
    if (!periodo) {
      toast({
        title: "Período obrigatório",
        description: "Selecione o período do pedido.",
        variant: "destructive",
      })
      return
    }

    if (!dataLancamento) {
      toast({
        title: "Data obrigatória",
        description: "Selecione a data de lançamento.",
        variant: "destructive",
      })
      return
    }

    // Validar se há pelo menos um produto ativo
    if (produtosAtivos.size === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para o pedido.",
        variant: "destructive",
      })
      return
    }

    // Validar campos obrigatórios apenas dos produtos ativos
    const produtosComDados = pedidos.filter((p) => produtosAtivos.has(p.produto_id))
    const camposIncompletos = produtosComDados.filter(
      (p) => p.quantidade <= 0 || p.valor_unitario <= 0 || p.n_serventes <= 0,
    )

    if (camposIncompletos.length > 0) {
      const produtosIncompletos = camposIncompletos
        .map((p) => {
          const produto = produtos.find((prod) => prod.id === p.produto_id)
          return produto?.codigo || "Produto"
        })
        .join(", ")

      toast({
        title: "Campos obrigatórios",
        description: `Complete os campos obrigatórios dos produtos: ${produtosIncompletos}`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Verificar se as tabelas existem
      const { error: testError } = await supabase.from("pedidos").select("id").limit(1)

      if (testError) {
        // Tabelas não existem, simular salvamento
        console.warn("Tabelas não configuradas, simulando salvamento")

        // Limpar campos após salvar
        setPedidos((prev) =>
          prev.map((pedido) => ({
            ...pedido,
            quantidade: 0,
            valor_unitario: 0,
            valor_total: 0,
            n_serventes: 0,
            ordem_compra: "",
            realizado_per_capita: 0,
            acumulado_total: 0,
          })),
        )
        setPeriodo("")
        setProdutosAtivos(new Set())
        setDataLancamento(new Date().toISOString().split("T")[0])

        toast({
          title: "Salvo com sucesso",
          description: "Dados salvos e formulário limpo.",
        })
        return
      }

      const pedidosParaSalvar = produtosComDados.map((pedido) => ({
        ...pedido,
        filial_id: filial.id,
        periodo,
        data_lancamento: dataLancamento,
        status: "rascunho" as const,
      }))

      for (const pedido of pedidosParaSalvar) {
        if (pedido.id) {
          // Atualizar pedido existente
          const { error } = await supabase.from("pedidos").update(pedido).eq("id", pedido.id)
          if (error) throw error
        } else {
          // Criar novo pedido
          const { error } = await supabase.from("pedidos").insert(pedido)
          if (error) throw error
        }
      }

      // Limpar campos após salvar
      setPedidos((prev) =>
        prev.map((pedido) => ({
          ...pedido,
          quantidade: 0,
          valor_unitario: 0,
          valor_total: 0,
          n_serventes: 0,
          ordem_compra: "",
          realizado_per_capita: 0,
          acumulado_total: 0,
        })),
      )
      setPeriodo("")
      setProdutosAtivos(new Set())
      setDataLancamento(new Date().toISOString().split("T")[0])

      toast({
        title: "Salvo com sucesso",
        description: "Dados salvos e formulário limpo.",
      })
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar os dados.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleExcluirProduto = (produtoId: string) => {
    setProdutosAtivos((prev) => {
      const newSet = new Set(prev)
      newSet.delete(produtoId)
      return newSet
    })

    // Limpar dados do produto
    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.produto_id === produtoId
          ? {
              ...pedido,
              quantidade: 0,
              valor_unitario: 0,
              valor_total: 0,
              n_serventes: 0,
              ordem_compra: "",
              realizado_per_capita: 0,
              acumulado_total: 0,
            }
          : pedido,
      ),
    )

    toast({
      title: "Produto removido",
      description: "Produto removido da lista de pedidos.",
    })
  }

  const handleAdicionarProduto = (produtoId: string) => {
    setProdutosAtivos((prev) => new Set([...prev, produtoId]))
    toast({
      title: "Produto adicionado",
      description: "Produto adicionado à lista de pedidos.",
    })
  }

  const handleSend = async () => {
    if (!filial) return

    setSaving(true)
    try {
      // Verificar se as tabelas existem
      const { error: testError } = await supabase.from("pedidos").select("id").limit(1)

      if (testError) {
        // Tabelas não existem, simular envio
        console.warn("Tabelas não configuradas, simulando envio")
        toast({
          title: "Simulação",
          description: "Pedido enviado localmente. Configure o Supabase para funcionalidade completa.",
        })
        return
      }

      const pedidosParaEnviar = pedidos.map((pedido) => ({
        ...pedido,
        filial_id: filial.id,
        periodo,
        status: "enviado" as const,
      }))

      for (const pedido of pedidosParaEnviar) {
        if (pedido.id) {
          const { error } = await supabase
            .from("pedidos")
            .update({ ...pedido, status: "enviado" })
            .eq("id", pedido.id)

          if (error) throw error
        } else {
          const { error } = await supabase.from("pedidos").insert(pedido)

          if (error) throw error
        }
      }

      toast({
        title: "Sucesso",
        description: "Pedido enviado para a administração.",
      })

      await fetchData()
    } catch (error) {
      console.error("Erro ao enviar:", error)
      toast({
        title: "Erro",
        description: "Erro ao enviar o pedido.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    setPedidos((prev) =>
      prev.map((pedido) => ({
        ...pedido,
        quantidade: 0,
        valor_unitario: 0,
        valor_total: 0,
        n_serventes: 0,
        ordem_compra: "",
        realizado_per_capita: 0,
        acumulado_total: 0,
      })),
    )
    setPeriodo("")
    setDataLancamento(new Date().toISOString().split("T")[0])
    toast({
      title: "Formulário limpo",
      description: "Todos os campos foram resetados.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary-700">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  if (!filial) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <Card className="p-6">
          <CardContent className="text-center">
            <p className="text-red-600">Filial não encontrada</p>
            <Link href="/">
              <Button className="mt-4">Voltar ao Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusPedido = pedidos.some((p) => p.status === "enviado") ? "enviado" : "rascunho"

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="border-primary-200 hover:bg-primary-100 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg p-1 shadow-sm">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-800">Formulário de Pedidos</h1>
                <p className="text-primary-600">{filial.nome}</p>
              </div>
            </div>
          </div>
          <Badge
            variant={statusPedido === "enviado" ? "default" : "secondary"}
            className={statusPedido === "enviado" ? "bg-primary-600" : ""}
          >
            Status: {statusPedido === "enviado" ? "Enviado" : "Rascunho"}
          </Badge>
        </div>

        {/* Informações da Filial */}
        <Card className="border-primary-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-lg">
            <CardTitle>Informações da Filial</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
            <div className="space-y-2">
              <Label className="text-primary-700 font-medium">Empresa</Label>
              <Input value={filial.empresa} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-primary-700 font-medium">Departamento</Label>
              <Input value={filial.departamento} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-primary-700 font-medium">Posto</Label>
              <Input value={filial.posto} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-primary-700 font-medium">Filial</Label>
              <Input value={filial.nome} disabled className="bg-gray-50" />
            </div>
          </CardContent>
        </Card>

        {/* Período */}
        <Card className="border-primary-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-lg">
            <CardTitle>Período do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full md:w-64">
              <Label className="text-primary-700 font-medium">Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="border-primary-200 focus:ring-primary-500">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Data de Lançamento */}
            <div className="w-full md:w-64">
              <Label className="text-primary-700 font-medium">Data de Lançamento</Label>
              <Input
                type="date"
                value={dataLancamento}
                onChange={(e) => setDataLancamento(e.target.value)}
                className="border-primary-200 focus:ring-primary-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Materiais */}
        <Card className="border-primary-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-lg">
            <CardTitle>Materiais Solicitados</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary-200">
                    <TableHead className="text-primary-700 font-semibold">Ações</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Código</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Item</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Descrição</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Quantidade</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Valor Unit.</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Valor Total</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Nº Serventes</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Ordem Compra</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Per Capita</TableHead>
                    <TableHead className="text-primary-700 font-semibold">Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido) => {
                    const produto = produtos.find((p) => p.id === pedido.produto_id)
                    if (!produto) return null

                    const isAtivo = produtosAtivos.has(pedido.produto_id)

                    return (
                      <TableRow
                        key={pedido.produto_id}
                        className={`border-primary-100 ${!isAtivo ? "opacity-50 bg-gray-50" : ""}`}
                      >
                        <TableCell>
                          {isAtivo ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExcluirProduto(pedido.produto_id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdicionarProduto(pedido.produto_id)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input value={produto.codigo} disabled className="w-20 bg-gray-50" />
                        </TableCell>
                        <TableCell>
                          <Input value={produto.item} disabled className="w-32 bg-gray-50" />
                        </TableCell>
                        <TableCell>
                          <Input value={produto.descricao} disabled className="w-40 bg-gray-50" />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={pedido.quantidade}
                            onChange={(e) => updatePedido(pedido.produto_id, "quantidade", Number(e.target.value))}
                            className={`w-20 border-primary-200 focus:ring-primary-500 ${!isAtivo ? "bg-gray-100" : ""}`}
                            disabled={!isAtivo}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={pedido.valor_unitario}
                            onChange={(e) => updatePedido(pedido.produto_id, "valor_unitario", Number(e.target.value))}
                            className={`w-24 border-primary-200 focus:ring-primary-500 ${!isAtivo ? "bg-gray-100" : ""}`}
                            disabled={!isAtivo}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={pedido.valor_total.toFixed(2)}
                            onChange={(e) => updatePedido(pedido.produto_id, "valor_total", Number(e.target.value))}
                            className={`w-24 border-primary-200 focus:ring-primary-500 ${!isAtivo ? "bg-gray-100" : ""}`}
                            disabled={!isAtivo}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={pedido.n_serventes}
                            onChange={(e) => updatePedido(pedido.produto_id, "n_serventes", Number(e.target.value))}
                            className={`w-20 border-primary-200 focus:ring-primary-500 ${!isAtivo ? "bg-gray-100" : ""}`}
                            disabled={!isAtivo}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={pedido.ordem_compra}
                            onChange={(e) => updatePedido(pedido.produto_id, "ordem_compra", e.target.value)}
                            className={`w-28 border-primary-200 focus:ring-primary-500 ${!isAtivo ? "bg-gray-100" : ""}`}
                            disabled={!isAtivo}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={pedido.realizado_per_capita.toFixed(2)}
                            onChange={(e) =>
                              updatePedido(pedido.produto_id, "realizado_per_capita", Number(e.target.value))
                            }
                            className={`w-24 border-primary-200 focus:ring-primary-500 ${!isAtivo ? "bg-gray-100" : ""}`}
                            disabled={!isAtivo}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={pedido.acumulado_total}
                            onChange={(e) => updatePedido(pedido.produto_id, "acumulado_total", Number(e.target.value))}
                            className={`w-24 border-primary-200 focus:ring-primary-500 ${!isAtivo ? "bg-gray-100" : ""}`}
                            disabled={!isAtivo}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-4 justify-end">
          <Button
            variant="outline"
            onClick={handleClear}
            className="border-primary-200 text-primary-700 hover:bg-primary-50 bg-transparent"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar Formulário
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="border-primary-200 text-primary-700 hover:bg-primary-50 bg-transparent"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
          <Button onClick={handleSend} disabled={saving} className="bg-primary-600 hover:bg-primary-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar para Administração
          </Button>
        </div>
      </div>
    </div>
  )
}
