package com.zentry.backend.controller;

import com.zentry.backend.service.FestivosService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/festivos")
@RequiredArgsConstructor
public class FestivosController {

    private final FestivosService festivosService;

    @GetMapping("/{year}")
    public List<Map<String, String>> getFestivos(@PathVariable int year) {
        return festivosService.getFestivos(year);
    }
}