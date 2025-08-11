"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Download, FileText, BarChart3, PieChart, Loader2, Plus, Edit, Trash2, Save } from "lucide-react"
import Link from "next/link"
import {
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Pie,
} from "recharts"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface ConsolidatedData {
  id: string
  empresa: string
  departamento: string
  posto: string
  filial: string
  previstoPerCapita: number
  nServentes: number
  previstoTotalCTR: number
  mesesAcumulados: number
  previstoTotalFilial: number
  ordemCompra: string
  realizadoPerCapita: number
  acumuladoTotal: number
  acumuladoPrevisto: number
  diferencaSobrePrevisto: number
  percentualVariacao: number
  status: "enviado" | "pendente"
}

interface Produto {
  id: string
  codigo: string
  item: string
  descricao: string
  created_at?: string
}

const mockData: ConsolidatedData[] = [
  {
    id: "1",
    empresa: "Empresa ABC Ltda",
    departamento: "Operações",
    posto: "Filial Regional",
    filial: "São Paulo - Centro",
    previstoPerCapita: 150.0,
    nServentes: 25,
    previstoTotalCTR: 3750.0,
    mesesAcumulados: 3,
    previstoTotalFilial: 11250.0,
    ordemCompra: "OC-2024-001",
    realizadoPerCapita: 165.5,
    acumuladoTotal: 4137.5,
    acumuladoPrevisto: 11250.0,
    diferencaSobrePrevisto: 387.5,
    percentualVariacao: 10.33,
    status: "enviado",
  },
  {
    id: "2",
    empresa: "Empresa ABC Ltda",
    departamento: "Operações",
    posto: "Filial Regional",
    filial: "Rio de Janeiro - Copacabana",
    previstoPerCapita: 140.0,
    nServentes: 20,
    previstoTotalCTR: 2800.0,
    mesesAcumulados: 3,
    previstoTotalFilial: 8400.0,
    ordemCompra: "OC-2024-002",
    realizadoPerCapita: 132.75,
    acumuladoTotal: 2655.0,
    acumuladoPrevisto: 8400.0,
    diferencaSobrePrevisto: -145.0,
    percentualVariacao: -5.18,
    status: "enviado",
  },
  {
    id: "3",
    empresa: "Empresa ABC Ltda",
    departamento: "Operações",
    posto: "Filial Regional",
    filial: "Belo Horizonte - Centro",
    previstoPerCapita: 160.0,
    nServentes: 18,
    previstoTotalCTR: 2880.0,
    mesesAcumulados: 3,
    previstoTotalFilial: 8640.0,
    ordemCompra: "OC-2024-003",
    realizadoPerCapita: 175.2,
    acumuladoTotal: 3153.6,
    acumuladoPrevisto: 8640.0,
    diferencaSobrePrevisto: 273.6,
    percentualVariacao: 9.5,
    status: "pendente",
  },
]

const pieData = mockData.map((item) => ({
  name: item.filial,
  value: Math.abs(item.percentualVariacao),
  color: item.percentualVariacao > 0 ? "#ef4444" : "#22c55e",
}))

const barData = mockData.map((item) => ({
  filial: item.filial.split(" - ")[0],
  previsto: item.acumuladoPrevisto,
  realizado: item.acumuladoTotal,
}))

export default function AdminPage() {
  const [filtros, setFiltros] = useState({
    periodo: "",
    filial: "",
    produto: "",
    status: "",
  })

  const [data, setData] = useState<ConsolidatedData[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProdutos, setLoadingProdutos] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [formProduto, setFormProduto] = useState({
    codigo: "",
    item: "",
    descricao: "",
  })

  useEffect(() => {
    fetchConsolidatedData()
    fetchProdutos()
  }, [])

  const fetchConsolidatedData = async () => {
    try {
      const { data: pedidosData, error } = await supabase.from("pedidos").select(`
        *,
        filiais (nome, empresa, departamento, posto),
        produtos (codigo, item, descricao)
      `)

      if (error) {
        console.warn("Tabelas não encontradas, usando dados mock:", error.message)
        setData(mockData)
        return
      }

      const consolidated =
        pedidosData?.map((pedido) => ({
          id: pedido.id,
          empresa: pedido.filiais.empresa,
          departamento: pedido.filiais.departamento,
          posto: pedido.filiais.posto,
          filial: pedido.filiais.nome,
          previstoPerCapita: 150.0,
          nServentes: pedido.n_serventes,
          previstoTotalCTR: pedido.n_serventes * 150.0,
          mesesAcumulados: 3,
          previstoTotalFilial: pedido.n_serventes * 150.0 * 3,
          ordemCompra: pedido.ordem_compra,
          realizadoPerCapita: pedido.realizado_per_capita,
          acumuladoTotal: pedido.acumulado_total,
          acumuladoPrevisto: pedido.n_serventes * 150.0 * 3,
          diferencaSobrePrevisto: pedido.acumulado_total - pedido.n_serventes * 150.0 * 3,
          percentualVariacao:
            ((pedido.acumulado_total - pedido.n_serventes * 150.0 * 3) / (pedido.n_serventes * 150.0 * 3)) * 100,
          status: pedido.status,
        })) || []

      setData(consolidated.length > 0 ? consolidated : mockData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const fetchProdutos = async () => {
    setLoadingProdutos(true)
    try {
      const { data: produtosData, error } = await supabase.from("produtos").select("*").order("codigo")

      if (error) {
        console.warn("Tabela produtos não encontrada, usando dados mock")
        setProdutos([
          { id: "1", codigo: "MAT001", item: "Material de Limpeza", descricao: "Detergente neutro 5L" },
          { id: "2", codigo: "MAT002", item: "Material de Escritório", descricao: "Papel A4 500 folhas" },
          { id: "3", codigo: "MAT003", item: "Equipamento de Segurança", descricao: "Capacete de proteção" },
          { id: "4", codigo: "MAT004", item: "Material de Higiene", descricao: "Papel higiênico 12 rolos" },
          { id: "5", codigo: "MAT005", item: "Equipamento de Limpeza", descricao: "Vassoura de piaçava" },
        ])
      } else {
        setProdutos(produtosData || [])
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      setProdutos([
        { id: "1", codigo: "MAT001", item: "Material de Limpeza", descricao: "Detergente neutro 5L" },
        { id: "2", codigo: "MAT002", item: "Material de Escritório", descricao: "Papel A4 500 folhas" },
        { id: "3", codigo: "MAT003", item: "Equipamento de Segurança", descricao: "Capacete de proteção" },
        { id: "4", codigo: "MAT004", item: "Material de Higiene", descricao: "Papel higiênico 12 rolos" },
        { id: "5", codigo: "MAT005", item: "Equipamento de Limpeza", descricao: "Vassoura de piaçava" },
      ])
    } finally {
      setLoadingProdutos(false)
    }
  }

  const handleSaveProduto = async () => {
    if (!formProduto.codigo || !formProduto.item || !formProduto.descricao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos do produto.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error: testError } = await supabase.from("produtos").select("id").limit(1)

      if (testError) {
        // Simular salvamento
        const newId = Date.now().toString()
        if (editingProduto) {
          setProdutos((prev) => prev.map((p) => (p.id === editingProduto.id ? { ...p, ...formProduto } : p)))
          toast({
            title: "Produto atualizado",
            description: "Produto atualizado com sucesso (simulação).",
          })
        } else {
          setProdutos((prev) => [...prev, { id: newId, ...formProduto }])
          toast({
            title: "Produto criado",
            description: "Produto criado com sucesso (simulação).",
          })
        }
      } else {
        if (editingProduto) {
          const { error } = await supabase.from("produtos").update(formProduto).eq("id", editingProduto.id)
          if (error) throw error
          toast({
            title: "Produto atualizado",
            description: "Produto atualizado com sucesso.",
          })
        } else {
          const { error } = await supabase.from("produtos").insert(formProduto)
          if (error) throw error
          toast({
            title: "Produto criado",
            description: "Produto criado com sucesso.",
          })
        }
        await fetchProdutos()
      }

      setDialogOpen(false)
      setEditingProduto(null)
      setFormProduto({ codigo: "", item: "", descricao: "" })
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar produto.",
        variant: "destructive",
      })
    }
  }

  const handleEditProduto = (produto: Produto) => {
    setEditingProduto(produto)
    setFormProduto({
      codigo: produto.codigo,
      item: produto.item,
      descricao: produto.descricao,
    })
    setDialogOpen(true)
  }

  const handleDeleteProduto = async (produto: Produto) => {
    try {
      const { error: testError } = await supabase.from("produtos").select("id").limit(1)

      if (testError) {
        // Simular exclusão
        setProdutos((prev) => prev.filter((p) => p.id !== produto.id))
        toast({
          title: "Produto excluído",
          description: "Produto excluído com sucesso (simulação).",
        })
      } else {
        const { error } = await supabase.from("produtos").delete().eq("id", produto.id)
        if (error) throw error
        toast({
          title: "Produto excluído",
          description: "Produto excluído com sucesso.",
        })
        await fetchProdutos()
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir produto.",
        variant: "destructive",
      })
    }
  }

  const filteredData = data.filter((item) => {
    return (
      (!filtros.filial || item.filial.includes(filtros.filial)) && (!filtros.status || item.status === filtros.status)
    )
  })

  const handleExportExcel = () => {
    const csvContent = [
      [
        "Empresa",
        "Departamento",
        "Posto",
        "Filial",
        "Previsto Per Capita",
        "Nº Serventes",
        "Previsto Total CTR",
        "Meses Acumulados",
        "Previsto Total Filial",
        "Nº Ordem Compra",
        "Realizado Per Capita",
        "Acumulado Total",
        "Acumulado Previsto",
        "Diferença Sobre Previsto",
        "Percentual Variação",
        "Status",
      ],
      ...filteredData.map((item) => [
        item.empresa,
        item.departamento,
        item.posto,
        item.filial,
        item.previstoPerCapita,
        item.nServentes,
        item.previstoTotalCTR,
        item.mesesAcumulados,
        item.previstoTotalFilial,
        item.ordemCompra,
        item.realizadoPerCapita,
        item.acumuladoTotal,
        item.acumuladoPrevisto,
        item.diferencaSobrePrevisto,
        item.percentualVariacao,
        item.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "relatorio-consolidado.csv"
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary-700">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dados...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg p-1 shadow-sm">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-800">Painel Administrativo</h1>
                <p className="text-primary-600">Consolidado de Pedidos por Filial</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="border-primary-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select
                value={filtros.periodo}
                onValueChange={(value) => setFiltros((prev) => ({ ...prev, periodo: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select
                value={filtros.filial}
                onValueChange={(value) => setFiltros((prev) => ({ ...prev, filial: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as filiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="São Paulo">São Paulo</SelectItem>
                  <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                  <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select
                value={filtros.produto}
                onValueChange={(value) => setFiltros((prev) => ({ ...prev, produto: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limpeza">Material de Limpeza</SelectItem>
                  <SelectItem value="escritorio">Material de Escritório</SelectItem>
                  <SelectItem value="seguranca">Equipamento de Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filtros.status}
                onValueChange={(value) => setFiltros((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para Tabela, Gráficos e Produtos */}
        <Tabs defaultValue="tabela" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tabela">Tabela Consolidada</TabsTrigger>
            <TabsTrigger value="graficos">Gráficos e Indicadores</TabsTrigger>
            <TabsTrigger value="produtos">Cadastro de Produtos</TabsTrigger>
          </TabsList>

          <TabsContent value="tabela">
            <Card className="border-primary-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
                <CardTitle>Dados Consolidados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filial</TableHead>
                        <TableHead>Previsto Per Capita</TableHead>
                        <TableHead>Nº Serventes</TableHead>
                        <TableHead>Previsto Total CTR</TableHead>
                        <TableHead>Realizado Per Capita</TableHead>
                        <TableHead>Acumulado Total</TableHead>
                        <TableHead>Diferença</TableHead>
                        <TableHead>% Variação</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.filial}</TableCell>
                          <TableCell>R$ {item.previstoPerCapita.toFixed(2)}</TableCell>
                          <TableCell>{item.nServentes}</TableCell>
                          <TableCell>R$ {item.previstoTotalCTR.toFixed(2)}</TableCell>
                          <TableCell>R$ {item.realizadoPerCapita.toFixed(2)}</TableCell>
                          <TableCell>R$ {item.acumuladoTotal.toFixed(2)}</TableCell>
                          <TableCell className={item.diferencaSobrePrevisto > 0 ? "text-red-600" : "text-green-600"}>
                            R$ {item.diferencaSobrePrevisto.toFixed(2)}
                          </TableCell>
                          <TableCell className={item.percentualVariacao > 0 ? "text-red-600" : "text-green-600"}>
                            {item.percentualVariacao.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.status === "enviado" ? "default" : "secondary"}>
                              {item.status === "enviado" ? "Enviado" : "Pendente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graficos">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-primary-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Percentual de Variação por Filial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-primary-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Previsto vs Realizado por Filial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="filial" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, ""]} />
                      <Legend />
                      <Bar dataKey="previsto" fill="#3b82f6" name="Previsto" />
                      <Bar dataKey="realizado" fill="#22c55e" name="Realizado" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Resumo Executivo */}
            <Card className="border-primary-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
                <CardTitle>Resumo Executivo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
                  <div className="text-sm text-gray-600">Total de Filiais</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {filteredData.reduce((acc, item) => acc + item.acumuladoTotal, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Realizado</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    R$ {filteredData.reduce((acc, item) => acc + item.acumuladoPrevisto, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Previsto</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredData.filter((item) => item.status === "pendente").length}
                  </div>
                  <div className="text-sm text-gray-600">Pedidos Pendentes</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="produtos">
            <Card className="border-primary-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-100 to-green-50">
                <div className="flex items-center justify-between">
                  <CardTitle>Cadastro de Produtos</CardTitle>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingProduto(null)
                          setFormProduto({ codigo: "", item: "", descricao: "" })
                        }}
                        className="bg-primary-600 hover:bg-primary-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Produto
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingProduto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                        <DialogDescription>
                          {editingProduto ? "Edite as informações do produto." : "Cadastre um novo produto no sistema."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Código</Label>
                          <Input
                            value={formProduto.codigo}
                            onChange={(e) => setFormProduto((prev) => ({ ...prev, codigo: e.target.value }))}
                            placeholder="Ex: MAT001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Item</Label>
                          <Input
                            value={formProduto.item}
                            onChange={(e) => setFormProduto((prev) => ({ ...prev, item: e.target.value }))}
                            placeholder="Ex: Material de Limpeza"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input
                            value={formProduto.descricao}
                            onChange={(e) => setFormProduto((prev) => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Ex: Detergente neutro 5L"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveProduto}>
                          <Save className="h-4 w-4 mr-2" />
                          {editingProduto ? "Atualizar" : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProdutos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Carregando produtos...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Data Criação</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtos.map((produto) => (
                          <TableRow key={produto.id}>
                            <TableCell className="font-medium">{produto.codigo}</TableCell>
                            <TableCell>{produto.item}</TableCell>
                            <TableCell>{produto.descricao}</TableCell>
                            <TableCell>
                              {produto.created_at ? new Date(produto.created_at).toLocaleDateString("pt-BR") : "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditProduto(produto)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteProduto(produto)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
