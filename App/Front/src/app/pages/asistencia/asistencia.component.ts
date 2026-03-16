import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Empleado {
  nombre: string;
  departamento: string;
  estado: 'Presente' | 'Ausente' | 'Retraso';
  entrada: string;
  salida: string;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.css']
})
export class AsistenciaComponent implements OnInit {
  empleados: Empleado[] = [
    { nombre: 'Ana López', departamento: 'RRHH', estado: 'Presente', entrada: '08:30', salida: '17:04' },
    { nombre: 'Carlos García', departamento: 'IT', estado: 'Presente', entrada: '09:00', salida: '18:15' },
    { nombre: 'María Pérez', departamento: 'Ventas', estado: 'Retraso', entrada: '09:45', salida: '-' },
    { nombre: 'Juan Martínez', departamento: 'RRHH', estado: 'Ausente', entrada: '-', salida: '-' },
  ];

  ngOnInit() { }
}
