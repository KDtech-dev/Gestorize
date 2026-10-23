<?php

use App\Http\Controllers\Api\AcessoController;
use App\Http\Controllers\Api\AjudaController;
use App\Http\Controllers\Api\DashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProdutoController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\FornecedorController;
use App\Http\Controllers\Api\FuncionarioController;
use App\Http\Controllers\Api\OrcamentoController;
use App\Http\Controllers\Api\RelatorioController;
use App\Http\Controllers\Api\UnidadeMedidaController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VendaController;
use App\Http\Controllers\Api\OrganizationController;

Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('organizations')->middleware('global.admin')->group(function () {
        Route::get('/', [OrganizationController::class, 'index']);
        Route::get('/metrics', [OrganizationController::class, 'metrics']);
        Route::post('/', [OrganizationController::class, 'store']);
        Route::put('/{organization}', [OrganizationController::class, 'update']);
    });
    Route::put('/acessos/papeis/{role}/permissoes', [AcessoController::class, 'definirDoPapel'])->middleware('global.admin');

    Route::middleware('tenant.context')->group(function () {
    Route::get('/dashboard/resumo', DashboardController::class);
    Route::post('/ajuda/contato', [AjudaController::class, 'contato'])->middleware('throttle:5,1');

    Route::get('/categorias', [CategoriaController::class, 'index'])->middleware('permission:produtos.ver');
    Route::post('/categorias', [CategoriaController::class, 'store'])->middleware('permission:produtos.criar');;
    Route::get('/unidades-medida', [UnidadeMedidaController::class, 'index'])->middleware('permission:produtos.ver');;

    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
    Route::put('me', [AuthController::class, 'atualizarMeuPerfil']);
    Route::get('/relatorios', [RelatorioController::class, 'index'])
        ->middleware('role_or_permission:admin|relatorios.ver');


    Route::prefix('acessos')->middleware(['auth:sanctum', 'permission:acessos.gerenciar'])->group(function () {
        Route::get('/papeis', [AcessoController::class, 'papeis']);
        Route::get('/permissoes', [AcessoController::class, 'permissoes']);

        Route::put('/users/{user}/permissoes', [AcessoController::class, 'definirDoUsuario',]);
    });

    Route::prefix('clientes')->group(function () {
        Route::get('/',        [ClienteController::class, 'index'])->middleware('permission:clientes.ver');
        Route::post('/',       [ClienteController::class, 'store'])->middleware('permission:clientes.criar');
        Route::get('/{id}',    [ClienteController::class, 'show'])->middleware('permission:clientes.ver');
        Route::put('/{id}',    [ClienteController::class, 'atualizar'])->middleware('permission:clientes.editar');
        Route::delete('/{id}', [ClienteController::class, 'destroy'])->middleware('permission:clientes.excluir');

        Route::post('/{id}/imagem',   [ClienteController::class, 'atualizarAvatar'])->middleware('permission:clientes.editar');
        Route::delete('/{id}/imagem', [ClienteController::class, 'removerAvatar'])->middleware('permission:clientes.editar');
    });

    Route::prefix('produtos')->group(function () {
        Route::get('/',        [ProdutoController::class, 'index'])->middleware('role_or_permission:admin|gestor|funcionario|produtos.ver|vendas.ver|vendas.criar');
        Route::get('/codigo/{codigo}', [ProdutoController::class, 'buscarPorCodigo'])->middleware('role_or_permission:admin|gestor|funcionario|produtos.ver|vendas.ver|vendas.criar');
        Route::post('/',       [ProdutoController::class, 'store'])->middleware('permission:produtos.criar');
        Route::get('/{id}',    [ProdutoController::class, 'show'])->middleware('permission:produtos.ver');
        Route::put('/{produto}', [ProdutoController::class, 'update'])->middleware('permission:produtos.editar');
        Route::delete('/{produto}', [ProdutoController::class, 'destroy'])->middleware('permission:produtos.excluir');
        Route::post('/{produto}/imagem', [ProdutoController::class, 'adicionarImagem'])->middleware('permission:produtos.editar');
        Route::delete('/{id}/imagem', [ProdutoController::class, 'removerImagem'])->middleware('permission:produtos.editar');
        Route::put('/{id}/imagem/principal', [ProdutoController::class, 'definirImagemPrincipal'])->middleware('permission:produtos.editar');
        Route::post('/{produto}/imagem/principal', [ProdutoController::class, 'substituirImagemPrincipal'])->middleware('permission:produtos.editar');
    });

    Route::prefix('vendas')->group(function () {
        Route::get('/', [VendaController::class, 'index'])->middleware('permission:vendas.ver');
        Route::post('/', [VendaController::class, 'store'])->middleware('role_or_permission:admin|gestor|funcionario|vendas.criar');
    });

    Route::prefix('fornecedores')->group(function () {
        Route::get('/', [FornecedorController::class, 'index'])->middleware('permission:fornecedores.ver');
        Route::post('/', [FornecedorController::class, 'store'])->middleware('permission:fornecedores.criar');
        Route::get('/{id}', [FornecedorController::class, 'show'])->middleware('permission:fornecedores.ver');
        Route::put('/{id}', [FornecedorController::class, 'atualizar'])->middleware('permission:fornecedores.editar');
        Route::delete('/{id}', [FornecedorController::class, 'destroy'])->middleware('permission:fornecedores.excluir');

        Route::post('/{id}/imagem', [FornecedorController::class, 'atualizarAvatar'])->middleware('permission:fornecedores.editar');
        Route::delete('/{id}/imagem', [FornecedorController::class, 'removerAvatar'])->middleware('permission:fornecedores.editar');
    });

    Route::prefix('funcionarios')->group(function () {
        Route::get('/', [FuncionarioController::class, 'index'])->middleware('permission:users.ver');
        Route::post('/', [FuncionarioController::class, 'store'])->middleware('permission:users.criar');
        Route::get('/{id}', [FuncionarioController::class, 'show'])->middleware('permission:users.ver');
        Route::put('/{id}', [FuncionarioController::class, 'atualizar'])->middleware('permission:users.editar');
        Route::delete('/{id}', [FuncionarioController::class, 'destroy'])->middleware('permission:users.excluir', 'prevent.admin.self.deletion');

        Route::post('/{id}/avatar', [FuncionarioController::class, 'atualizarAvatar'])->middleware('permission:users.editar');
        Route::delete('/{id}/avatar', [FuncionarioController::class, 'removerAvatar'])->middleware('permission:users.editar');
    });

    Route::prefix('orcamentos')->group(function () {
        Route::get('/', [OrcamentoController::class, 'index'])->middleware('permission:orcamentos.ver');
        Route::post('/', [OrcamentoController::class, 'store'])->middleware('permission:orcamentos.criar');
        Route::get('/{id}', [OrcamentoController::class, 'show'])->middleware('permission:orcamentos.ver');
        Route::put('/{id}', [OrcamentoController::class, 'update'])->middleware('permission:orcamentos.editar');
        Route::patch('/{id}/aprovar', [OrcamentoController::class, 'aprovar']);
        Route::delete('/{id}', [OrcamentoController::class, 'destroy'])->middleware('permission:orcamentos.excluir');
    });


    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index'])->middleware('permission:users.ver');
        Route::post('/', [UserController::class, 'store'])->middleware('permission:users.criar');
        Route::get('/{user}', [UserController::class, 'show'])->middleware('permission:users.ver');
        Route::put('/{user}', [UserController::class, 'update'])->middleware('permission:users.editar');
        Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('permission:users.excluir');
    });
    });
});
