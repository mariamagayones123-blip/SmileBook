<?php
namespace App\Http\Controllers;

use App\Models\Dentist;
use App\Models\Service;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function dentists() { return Dentist::with('services:id')->orderBy('id')->get(); }
    public function services() { return Service::with('dentists:id')->orderBy('name')->get(); }

    // ---- admin ----
    public function storeService(Request $r)
    {
        $data = $this->serviceRules($r);
        $hasDentistIds = array_key_exists('dentist_ids', $data);
        $dentistIds = $data['dentist_ids'] ?? [];
        unset($data['dentist_ids']);
        $service = Service::create($data);
        if ($hasDentistIds) $service->dentists()->sync($dentistIds);
        return response()->json($service->load('dentists:id'), 201);
    }

    public function updateService(Request $r, Service $service)
    {
        $data = $this->serviceRules($r);
        $hasDentistIds = array_key_exists('dentist_ids', $data);
        $dentistIds = $data['dentist_ids'] ?? [];
        unset($data['dentist_ids']);
        $service->update($data);
        if ($hasDentistIds) $service->dentists()->sync($dentistIds);
        return $service->load('dentists:id');
    }

    public function destroyService(Service $service)
    {
        $service->delete();
        return response()->noContent();
    }

    public function updateDentist(Request $r, Dentist $dentist)
    {
        $data = $r->validate([
            'start_time'   => 'required|date_format:H:i',
            'end_time'     => 'required|date_format:H:i|after:start_time',
            'slot_minutes' => 'required|integer|min:15|max:240',
            'work_days'    => 'required|array|min:1',
            'work_days.*'  => 'integer|between:0,6',
        ]);
        $dentist->update($data);
        return $dentist;
    }

    public function updateDentistServices(Request $r, Dentist $dentist)
    {
        $data = $r->validate([
            'service_ids' => 'required|array',
            'service_ids.*' => 'integer|distinct|exists:services,id',
        ]);
        $dentist->services()->sync($data['service_ids']);
        return $dentist->load('services:id');
    }

    private function serviceRules(Request $r): array
    {
        return $r->validate([
            'name'        => 'required|string|max:100',
            'category'    => 'nullable|string|in:General & Preventive,Orthodontics,Oral Surgery',
            'description' => 'nullable|string|max:255',
            'price'       => 'required|numeric|min:0',
            'dentist_ids' => 'sometimes|nullable|array',
            'dentist_ids.*' => 'integer|distinct|exists:dentists,id',
        ]);
    }
}
