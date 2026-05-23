import { Component, OnInit, signal } from '@angular/core';
import { EquipoService, Equipo } from '../../services/equipo.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mi-equipo.component.html',
  styleUrls: ['./mi-equipo.component.css']
})
export class MiEquipoComponent implements OnInit {
  listaEmpleados: any[] = [];
  listaSubequipos: Equipo[] = [];

  modalSubequipoAbierto = signal(false);
  modalEliminarAbierto = signal(false);
  esEdicion = signal(false);
  subequipoEliminando = signal<Equipo | null>(null);

  subequipoForm: any = {
    nombre: '',
    liderId: '',
    miembrosIds: []
  };

  esAdmin = false;
  esMando = false;

  constructor(
    private equipoService: EquipoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.esAdmin = this.authService.getSystemRole() === 'ADMIN';
    this.esMando = this.authService.getCompanyRole() === 'MANDO';
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.equipoService.getMisEmpleados().subscribe({
      next: (data) => this.listaEmpleados = data,
      error: (err) => console.error(err)
    });

    this.equipoService.getSubequipos().subscribe({
      next: (data) => this.listaSubequipos = data,
      error: (err) => console.error(err)
    });
  }

  abrirModalCrearSubequipo() {
    this.esEdicion.set(false);
    this.subequipoForm = { nombre: '', liderId: '', miembrosIds: [] };
    this.modalSubequipoAbierto.set(true);
  }

  abrirModalEditar(sub: Equipo) {
    this.esEdicion.set(true);
    this.subequipoForm = { ...sub };
    this.modalSubequipoAbierto.set(true);
  }

  cerrarModalSubequipo() { this.modalSubequipoAbierto.set(false); }

  abrirModalEliminar(sub: Equipo) {
    this.subequipoEliminando.set(sub);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar() {
    this.modalEliminarAbierto.set(false);
    this.subequipoEliminando.set(null);
  }

  guardarSubequipo() {
    if (this.esEdicion()) {
      this.equipoService.actualizarSubequipo(this.subequipoForm).subscribe(() => {
        this.cerrarModalSubequipo();
        this.cargarDatos();
      });
    } else {
      this.equipoService.crearSubequipo(this.subequipoForm).subscribe(() => {
        this.cerrarModalSubequipo();
        this.cargarDatos();
      });
    }
  }

  confirmarEliminar() {
    const sub = this.subequipoEliminando();
    if (sub?.id) {
      this.equipoService.eliminarSubequipo(sub.id).subscribe(() => {
        this.cerrarModalEliminar();
        this.cargarDatos();
      });
    }
  }

  getNombreEmpleado(id: string): string {
    const emp = this.listaEmpleados.find(e => e.id === id);
    return emp ? `${emp.nombre} ${emp.apellido || ''}` : 'No asignado';
  }

isMiembroSeleccionado(id: string): boolean {
  if (!this.subequipoForm.miembrosIds) return false;
  return this.subequipoForm.miembrosIds.includes(id);
}

toggleMiembro(id: string): void {
  if (!this.subequipoForm.miembrosIds) {
    this.subequipoForm.miembrosIds = [];
  }

  const index = this.subequipoForm.miembrosIds.indexOf(id);
  if (index > -1) {
    this.subequipoForm.miembrosIds.splice(index, 1);
  } else {
    this.subequipoForm.miembrosIds.push(id);
  }
}
}
