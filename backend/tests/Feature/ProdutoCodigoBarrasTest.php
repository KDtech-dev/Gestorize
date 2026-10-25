<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Organization;
use App\Models\Produto;
use App\Models\UnidadeMedida;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProdutoCodigoBarrasTest extends TestCase
{
    use RefreshDatabase;

    private Organization $organization;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesSeeder::class);
        $this->organization = Organization::create(['name' => 'Loja A']);
        $this->user = User::factory()->create(['organization_id' => $this->organization->id]);
        $this->user->syncRoles(['gestor']);
        $this->actingAs($this->user, 'sanctum');
    }

    public function test_lookup_finds_legacy_barcode_uuid_label_prefix_and_manufacturer_code(): void
    {
        $product = $this->product('PRDABC123456');
        $product->codigosBarras()->create(['codigo' => '00789123456789', 'tipo' => 'fabricante']);

        $this->getJson('/api/produtos/codigo/PRDABC123456')->assertOk()->assertJsonPath('data.id', $product->id);
        $prefix = strtoupper(substr(str_replace('-', '', $product->id), 0, 12));
        $this->getJson('/api/produtos/codigo/'.$prefix)->assertOk()->assertJsonPath('data.id', $product->id);
        $this->getJson('/api/produtos/codigo/00789123456789')->assertOk()->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.codigos_barras.0', '00789123456789');
        $this->getJson('/api/produtos/codigo/NAOEXISTE')->assertNotFound();
    }

    public function test_codes_can_be_created_and_updated_and_duplicates_are_rejected(): void
    {
        $first = $this->product('PRDFIRST1234');
        $second = $this->product('PRDSECOND123');

        $this->putJson('/api/produtos/'.$first->id, ['codigos_barras' => ['0001234567890']])
            ->assertOk()->assertJsonPath('data.codigos_barras.0', '0001234567890');
        $this->putJson('/api/produtos/'.$second->id, ['codigos_barras' => ['0001234567890']])
            ->assertUnprocessable();

        $this->putJson('/api/produtos/'.$first->id, ['codigos_barras' => ['PRDSECOND123']])
            ->assertUnprocessable();

        $this->postJson('/api/produtos', [
            'nome' => 'Produto novo', 'preco_custo' => 10, 'porcentagem_lucro' => 20,
            'preco_venda' => 12, 'data_entrada' => now()->toDateString(), 'categoria_id' => $this->category()->id,
            'unidade_medida_id' => $this->unit()->id,
            'estoque' => 50, 'codigos_barras' => ['0009876543210'],
        ])->assertCreated()->assertJsonPath('data.codigos_barras.0', '0009876543210');
    }

    public function test_same_barcode_is_scoped_to_organization(): void
    {
        $product = $this->product('PRDORGONE123');
        $product->codigosBarras()->create(['codigo' => '7891111111111']);

        $otherOrganization = Organization::create(['name' => 'Loja B']);
        $otherUser = User::factory()->create(['organization_id' => $otherOrganization->id]);
        $otherUser->syncRoles(['gestor']);
        $this->actingAs($otherUser, 'sanctum');
        $otherProduct = $this->product('PRDORGTWO123');
        $otherProduct->codigosBarras()->create(['codigo' => '7891111111111']);

        $this->getJson('/api/produtos/codigo/7891111111111')->assertOk()->assertJsonPath('data.id', $otherProduct->id);
        $this->actingAs($this->user, 'sanctum');
        $this->getJson('/api/produtos/codigo/7891111111111')->assertOk()->assertJsonPath('data.id', $product->id);
    }

    private function product(string $barcode): Produto
    {
        return Produto::create([
            'nome' => 'Produto de teste', 'preco_custo' => 10, 'porcentagem_lucro' => 20,
            'preco_venda' => 12, 'data_entrada' => now()->toDateString(), 'categoria_id' => $this->category()->id,
            'unidade_medida_id' => $this->unit()->id, 'estoque' => 50, 'codigo_barras' => $barcode,
        ]);
    }

    private function category(): Categoria
    {
        return Categoria::firstOrCreate(['nome' => 'Geral']);
    }

    private function unit(): UnidadeMedida
    {
        return UnidadeMedida::firstOrCreate(['sigla' => 'UN'], ['nome' => 'Unidade']);
    }
}
