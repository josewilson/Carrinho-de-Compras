import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const moedaBR = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const listasPredefinidas = [
  {
    id: 'supermercado',
    nome: 'Supermercado',
    itens: [
      'Arroz 5kg',
      'Feijao 1kg',
      'Oleo 900ml',
      'Leite 1L',
      'Cafe 500g',
      'Acucar 1kg',
      'Macarrao 500g',
      'Molho de tomate',
      'Farinha de trigo 1kg',
      'Sal 1kg',
      'Papel higienico 12 rolos',
      'Detergente liquido',
      'Sabao em po 1kg',
      'Desinfetante 2L',
      'Agua mineral 1,5L',
      'Biscoito recheado',
    ],
  },
  {
    id: 'importados',
    nome: 'Loja de importados',
    itens: [
      'Capsula de cafe',
      'Chocolate belga',
      'Azeite extra virgem',
      'Pasta italiana',
      'Biscoito importado',
      'Molho especial',
      'Geleia premium',
      'Queijo parmesao importado',
      'Atum em azeite',
      'Vinho tinto seco',
      'Cookie americano',
      'Cha ingles',
      'Cereal importado',
      'Mostarda dijon',
      'Aceto balsamico',
      'Azeitona espanhola',
    ],
  },
  {
    id: 'construcao',
    nome: 'Material de construcao',
    itens: [
      'Cimento 50kg',
      'Areia media saco',
      'Tinta branca 18L',
      'Rolo de pintura',
      'Massa corrida 25kg',
      'Lixa para parede',
      'Cal hidratada 20kg',
      'Argamassa AC1 20kg',
      'Tijolo ceramico',
      'Rejunte 1kg',
      'Pincel 2 polegadas',
      'Fita crepe',
      'Tubo PVC 25mm',
      'Joelho PVC 25mm',
      'Torneira de pia',
      'Parafuso com bucha',
    ],
  },
]

const CHAVE_ITENS = 'carrinho:itens'
const CHAVE_LISTA = 'carrinho:lista-selecionada'
const CHAVE_HISTORICO = 'carrinho:historico'

const dataHoraBR = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const mapaComercio = Object.fromEntries(
  listasPredefinidas.map((lista) => [lista.id, lista.nome]),
)

function lerStorage(chave, valorPadrao) {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto ? JSON.parse(bruto) : valorPadrao
  } catch {
    return valorPadrao
  }
}

function normalizarItem(item) {
  return {
    id: item.id || crypto.randomUUID(),
    nome: String(item.nome || '').trim(),
    quantidade: Math.max(1, Math.floor(paraNumero(item.quantidade ?? 1))),
    precoUnitario: Math.max(0, paraNumero(item.precoUnitario ?? 0)),
    comprado: Boolean(item.comprado),
  }
}

function normalizarCompraHistorico(compra) {
  const itensCompra = Array.isArray(compra?.itens)
    ? compra.itens.map((item) => ({
        nome: String(item?.nome || '').trim(),
        quantidade: Math.max(1, Math.floor(paraNumero(item?.quantidade ?? 1))),
        precoUnitario: Math.max(0, paraNumero(item?.precoUnitario ?? 0)),
      }))
    : []

  const totalCalculado = itensCompra.reduce(
    (acumulador, item) => acumulador + item.quantidade * item.precoUnitario,
    0,
  )

  return {
    id: compra?.id || crypto.randomUUID(),
    data: compra?.data || new Date().toISOString(),
    tipoComercio: compra?.tipoComercio || 'outro',
    total: Math.max(0, paraNumero(compra?.total ?? totalCalculado)),
    itens: itensCompra,
  }
}

function paraNumero(valor) {
  const normalizado = String(valor).replace(',', '.').trim()
  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : 0
}

function formatarPrecoDigitado(valor) {
  const apenasDigitos = String(valor).replace(/\D/g, '')

  if (!apenasDigitos) {
    return '0,00'
  }

  return (Number(apenasDigitos) / 100).toFixed(2).replace('.', ',')
}

function formatarPrecoParaInputBR(valor) {
  return Math.max(0, paraNumero(valor)).toFixed(2).replace('.', ',')
}

function App() {
  const [nome, setNome] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [precoUnitario, setPrecoUnitario] = useState('0,00')
  const [itens, setItens] = useState(() =>
    lerStorage(CHAVE_ITENS, []).map(normalizarItem).filter((item) => item.nome),
  )
  const [listaSelecionada, setListaSelecionada] = useState(() => {
    const listaStorage = lerStorage(CHAVE_LISTA, listasPredefinidas[0].id)
    return listasPredefinidas.some((lista) => lista.id === listaStorage)
      ? listaStorage
      : listasPredefinidas[0].id
  })
  const [historico, setHistorico] = useState(() => lerStorage(CHAVE_HISTORICO, []))
  const [buscaItens, setBuscaItens] = useState('')
  const [filtroHistorico, setFiltroHistorico] = useState('todos')
  const [buscaHistorico, setBuscaHistorico] = useState('')
  const [mensagemBackup, setMensagemBackup] = useState('')
  const inputBackupRef = useRef(null)

  const subtotal = useMemo(
    () =>
      itens.reduce(
        (acumulador, item) => acumulador + item.quantidade * item.precoUnitario,
        0,
      ),
    [itens],
  )

  const itensComprados = useMemo(
    () => itens.reduce((acumulador, item) => acumulador + (item.comprado ? 1 : 0), 0),
    [itens],
  )

  const itensFiltrados = useMemo(() => {
    const termo = buscaItens.trim().toLowerCase()

    if (!termo) {
      return itens
    }

    return itens.filter((item) => item.nome.toLowerCase().includes(termo))
  }, [itens, buscaItens])

  const historicoFiltrado = useMemo(() => {
    const termo = buscaHistorico.trim().toLowerCase()

    return historico.filter((compra) => {
      const tipoCompra = compra.tipoComercio || 'outro'
      const passouTipo = filtroHistorico === 'todos' || tipoCompra === filtroHistorico

      if (!passouTipo) {
        return false
      }

      if (!termo) {
        return true
      }

      return compra.itens.some((item) => String(item.nome).toLowerCase().includes(termo))
    })
  }, [historico, filtroHistorico, buscaHistorico])

  const total = subtotal

  useEffect(() => {
    localStorage.setItem(CHAVE_ITENS, JSON.stringify(itens))
  }, [itens])

  useEffect(() => {
    localStorage.setItem(CHAVE_LISTA, JSON.stringify(listaSelecionada))
  }, [listaSelecionada])

  useEffect(() => {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico))
  }, [historico])

  useEffect(() => {
    if (!mensagemBackup) {
      return
    }

    const timeoutId = setTimeout(() => setMensagemBackup(''), 3200)
    return () => clearTimeout(timeoutId)
  }, [mensagemBackup])

  function limparFormulario() {
    setNome('')
    setQuantidade('1')
    setPrecoUnitario('0,00')
  }

  function adicionarItem(evento) {
    evento.preventDefault()

    const quantidadeNumero = Math.max(1, Math.floor(paraNumero(quantidade)))
    const precoNumero = paraNumero(precoUnitario)
    const nomeTratado = nome.trim()

    if (!nomeTratado || precoNumero <= 0) {
      return
    }

    setItens((itensAtuais) => {
      const indiceExistente = itensAtuais.findIndex(
        (item) => item.nome.toLowerCase() === nomeTratado.toLowerCase(),
      )

      if (indiceExistente >= 0) {
        return itensAtuais.map((item, indice) =>
          indice === indiceExistente
            ? {
                ...item,
                quantidade: item.quantidade + quantidadeNumero,
                precoUnitario: precoNumero,
              }
            : item,
        )
      }

      return [
        ...itensAtuais,
        {
          id: crypto.randomUUID(),
          nome: nomeTratado,
          quantidade: quantidadeNumero,
          precoUnitario: precoNumero,
          comprado: false,
        },
      ]
    })

    limparFormulario()
  }

  function removerItem(id) {
    setItens((itensAtuais) => itensAtuais.filter((item) => item.id !== id))
  }

  function definirQuantidade(id, novoValor) {
    const quantidadeNumero = Math.max(1, Math.floor(paraNumero(novoValor)))

    setItens((itensAtuais) =>
      itensAtuais.map((item) => {
        if (item.id !== id) {
          return item
        }

        return {
          ...item,
          quantidade: quantidadeNumero,
        }
      }),
    )
  }

  function definirPrecoUnitario(id, novoValor) {
    const precoNumero = Math.max(0, paraNumero(formatarPrecoDigitado(novoValor)))

    setItens((itensAtuais) =>
      itensAtuais.map((item) => {
        if (item.id !== id) {
          return item
        }

        return {
          ...item,
          precoUnitario: precoNumero,
        }
      }),
    )
  }

  function carregarListaPredefinida() {
    const lista = listasPredefinidas.find((opcao) => opcao.id === listaSelecionada)

    if (!lista) {
      return
    }

    setItens(
      lista.itens.map((nomeItem) => ({
        id: crypto.randomUUID(),
        nome: nomeItem,
        quantidade: 1,
        precoUnitario: 0,
        comprado: false,
      })),
    )
  }

  function alternarComprado(id) {
    setItens((itensAtuais) =>
      itensAtuais.map((item) =>
        item.id === id
          ? {
              ...item,
              comprado: !item.comprado,
            }
          : item,
      ),
    )
  }

  function finalizarCompra() {
    if (itens.length === 0) {
      return
    }

    const novaCompra = {
      id: crypto.randomUUID(),
      data: new Date().toISOString(),
      total,
      tipoComercio: listaSelecionada,
      itens: itens.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      })),
    }

    setHistorico((historicoAtual) => [novaCompra, ...historicoAtual].slice(0, 20))
    setItens([])
  }

  function reutilizarCompra(idCompra) {
    const compra = historico.find((itemHistorico) => itemHistorico.id === idCompra)

    if (!compra) {
      return
    }

    setItens(
      compra.itens.map((item) => ({
        id: crypto.randomUUID(),
        nome: item.nome,
        quantidade: Math.max(1, Math.floor(paraNumero(item.quantidade))),
        precoUnitario: Math.max(0, paraNumero(item.precoUnitario)),
        comprado: false,
      })),
    )
  }

  function limparHistorico() {
    setHistorico([])
  }

  function limparBuscaItens() {
    setBuscaItens('')
  }

  function limparFiltrosHistorico() {
    setFiltroHistorico('todos')
    setBuscaHistorico('')
  }

  function gerarPayloadBackup() {
    return {
      versao: 1,
      exportadoEm: new Date().toISOString(),
      listaSelecionada,
      itens,
      historico,
    }
  }

  function exportarBackup() {
    const arquivo = JSON.stringify(gerarPayloadBackup(), null, 2)
    const blob = new Blob([arquivo], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dataArquivo = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `backup-carrinho-${dataArquivo}.json`
    link.click()

    URL.revokeObjectURL(url)
    setMensagemBackup('Backup exportado com sucesso.')
  }

  async function compartilharBackup() {
    const arquivoTexto = JSON.stringify(gerarPayloadBackup(), null, 2)
    const dataArquivo = new Date().toISOString().slice(0, 10)
    const arquivo = new File([arquivoTexto], `backup-carrinho-${dataArquivo}.json`, {
      type: 'application/json',
    })

    try {
      if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
        await navigator.share({
          title: 'Backup Carrinho',
          text: 'Backup do carrinho para salvar na nuvem.',
          files: [arquivo],
        })
        setMensagemBackup('Backup compartilhado. Salve no Drive, WhatsApp ou e-mail.')
        return
      }

      exportarBackup()
    } catch {
      setMensagemBackup('Nao foi possivel compartilhar o backup.')
    }
  }

  async function importarBackup(evento) {
    const arquivo = evento.target.files?.[0]

    if (!arquivo) {
      return
    }

    try {
      const texto = await arquivo.text()
      const dados = JSON.parse(texto)

      const listaDestino = listasPredefinidas.some((lista) => lista.id === dados.listaSelecionada)
        ? dados.listaSelecionada
        : listasPredefinidas[0].id

      const itensImportados = Array.isArray(dados.itens)
        ? dados.itens.map(normalizarItem).filter((item) => item.nome)
        : []

      const historicoImportado = Array.isArray(dados.historico)
        ? dados.historico.map(normalizarCompraHistorico)
        : []

      setListaSelecionada(listaDestino)
      setItens(itensImportados)
      setHistorico(historicoImportado)
      setMensagemBackup('Backup importado com sucesso.')
    } catch {
      setMensagemBackup('Arquivo de backup invalido.')
    } finally {
      evento.target.value = ''
    }
  }

  return (
    <main className="app">
      <header className="cabecalho">
        <h1>Carrinho de Compras</h1>
        <p>Escolha o tipo de lista, preencha quantidade e valor e acompanhe os totais em tempo real.</p>
      </header>

      <section className="cartao">
        <h2>Listas prontas</h2>
        <div className="linha-lista-pronta">
          <label>
            Tipo de compra
            <select
              value={listaSelecionada}
              onChange={(evento) => setListaSelecionada(evento.target.value)}
            >
              {listasPredefinidas.map((lista) => (
                <option key={lista.id} value={lista.id}>
                  {lista.nome}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="botao-secundario" onClick={carregarListaPredefinida}>
            Carregar lista
          </button>
        </div>
        <p className="ajuda-lista">
          A lista carrega os itens base do comercio escolhido. Depois e so informar quantidade e
          valor de cada item.
        </p>
      </section>

      <section className="cartao">
        <h2>Backup e sincronizacao</h2>
        <p className="ajuda-lista">
          Exporte ou compartilhe o backup para salvar na nuvem (Drive, WhatsApp ou e-mail).
        </p>
        <div className="acoes-backup">
          <button type="button" className="botao-secundario" onClick={exportarBackup}>
            Exportar backup
          </button>
          <button type="button" className="botao-secundario" onClick={compartilharBackup}>
            Compartilhar backup
          </button>
          <button
            type="button"
            className="botao-secundario"
            onClick={() => inputBackupRef.current?.click()}
          >
            Importar backup
          </button>
          <input
            ref={inputBackupRef}
            type="file"
            accept="application/json"
            className="input-backup"
            onChange={importarBackup}
          />
        </div>
        {mensagemBackup && <p className="mensagem-backup">{mensagemBackup}</p>}
      </section>

      <section className="cartao">
        <h2>Novo item</h2>
        <form className="formulario" onSubmit={adicionarItem}>
          <label>
            Nome do item
            <input
              type="text"
              placeholder="Ex.: Arroz 5kg"
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              required
            />
          </label>

          <div className="linha-formulario">
            <label>
              Quantidade
              <input
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(evento) => setQuantidade(evento.target.value)}
                required
              />
            </label>

            <label>
              Preco unitario (R$)
              <input
                type="text"
                inputMode="numeric"
                value={precoUnitario}
                onChange={(evento) => setPrecoUnitario(formatarPrecoDigitado(evento.target.value))}
                required
              />
            </label>
          </div>

          <button type="submit">Adicionar item</button>
        </form>
      </section>

      <section className="cartao">
        <h2>Itens no carrinho</h2>
        <div className="linha-filtro">
          <label className="filtro-label">
            Buscar item
            <input
              type="text"
              placeholder="Ex.: Arroz, Cimento, Chocolate"
              value={buscaItens}
              onChange={(evento) => setBuscaItens(evento.target.value)}
            />
          </label>
          {buscaItens.trim() && (
            <button type="button" className="botao-filtro" onClick={limparBuscaItens}>
              Limpar busca
            </button>
          )}
        </div>
        {itens.length === 0 ? (
          <p className="vazio">Seu carrinho esta vazio.</p>
        ) : itensFiltrados.length === 0 ? (
          <p className="vazio">Nenhum item encontrado para essa busca.</p>
        ) : (
          <ul className="lista-itens">
            {itensFiltrados.map((item) => {
              const subtotalItem = item.quantidade * item.precoUnitario

              return (
                <li key={item.id} className={`item${item.comprado ? ' item-comprado' : ''}`}>
                  <div className="item-topo">
                    <div className="item-info">
                      <strong>{item.nome}</strong>
                    </div>
                    <label className="controle-comprado">
                      <input
                        type="checkbox"
                        checked={item.comprado}
                        onChange={() => alternarComprado(item.id)}
                      />
                      <span>Comprado</span>
                    </label>
                    <button
                      type="button"
                      className="botao-lixeira"
                      onClick={() => removerItem(item.id)}
                      title="Remover item"
                      aria-label="Remover item"
                    >
                      <svg
                        className="icone-lixeira"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4 7h16M9 3h6m-8 4 1 13a1 1 0 0 0 1 .92h6a1 1 0 0 0 1-.92L17 7M10 11v6m4-6v6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="item-detalhes">
                    <div className="campos-item">
                      <label className="campo-item">
                        Quantidade
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantidade}
                          onChange={(evento) => definirQuantidade(item.id, evento.target.value)}
                        />
                      </label>
                      <label className="campo-item">
                        Valor unitario (R$)
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatarPrecoParaInputBR(item.precoUnitario)}
                          onChange={(evento) => definirPrecoUnitario(item.id, evento.target.value)}
                        />
                      </label>
                    </div>
                    <span className="item-subtotal">{moedaBR.format(subtotalItem)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {itens.length > 0 && (
          <button type="button" className="botao-finalizar" onClick={finalizarCompra}>
            Finalizar compra e salvar no historico
          </button>
        )}
      </section>

      <section className="cartao">
        <div className="topo-historico">
          <h2>Historico</h2>
          {historico.length > 0 && (
            <button type="button" className="botao-limpar" onClick={limparHistorico}>
              Limpar historico
            </button>
          )}
        </div>

        <div className="filtros-historico">
          <label className="filtro-label">
            Tipo de comercio
            <select
              value={filtroHistorico}
              onChange={(evento) => setFiltroHistorico(evento.target.value)}
            >
              <option value="todos">Todos</option>
              {listasPredefinidas.map((lista) => (
                <option key={lista.id} value={lista.id}>
                  {lista.nome}
                </option>
              ))}
              <option value="outro">Outros</option>
            </select>
          </label>

          <label className="filtro-label">
            Buscar item no historico
            <input
              type="text"
              placeholder="Ex.: Feijao, Tinta, Azeite"
              value={buscaHistorico}
              onChange={(evento) => setBuscaHistorico(evento.target.value)}
            />
          </label>

          {(filtroHistorico !== 'todos' || buscaHistorico.trim()) && (
            <button type="button" className="botao-filtro" onClick={limparFiltrosHistorico}>
              Limpar filtros
            </button>
          )}
        </div>

        {historico.length === 0 ? (
          <p className="vazio">Nenhuma compra finalizada ainda.</p>
        ) : historicoFiltrado.length === 0 ? (
          <p className="vazio">Nenhuma compra encontrada para os filtros selecionados.</p>
        ) : (
          <ul className="lista-historico">
            {historicoFiltrado.map((compra) => (
              <li key={compra.id} className="item-historico">
                <div>
                  <strong>{dataHoraBR.format(new Date(compra.data))}</strong>
                  <p>
                    {compra.itens.length} itens - {moedaBR.format(compra.total)}
                  </p>
                  <p className="tipo-historico">
                    {mapaComercio[compra.tipoComercio] || 'Outros'}
                  </p>
                </div>
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={() => reutilizarCompra(compra.id)}
                >
                  Reutilizar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="cartao resumo">
        <h2>Resumo</h2>
        <div>
          <span>Subtotal</span>
          <strong>{moedaBR.format(subtotal)}</strong>
        </div>
        <div>
          <span>Itens comprados</span>
          <strong>
            {itensComprados}/{itens.length}
          </strong>
        </div>
        <div className="resumo-total">
          <span>Total da compra</span>
          <strong>{moedaBR.format(total)}</strong>
        </div>
      </aside>
    </main>
  )
}

export default App
