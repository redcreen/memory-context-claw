# Unified Memory Core Release Boundary

[English](release-boundary.md) | [中文](release-boundary.zh-CN.md)

## Purpose

This note defines what is released as product core, what stays adapter-specific, and what is intentionally deferred.

## Current Release Unit

Current release unit:

- one repo
- one package
- product core and adapters shipped together

## Product Release Boundary

The product boundary includes:

- contracts
- source / registry / reflection / projection / governance
- standalone runtime
- standalone command surfaces
- independent execution review

## Adapter Release Boundary

Adapter boundary includes:

- OpenClaw runtime integration
- Codex runtime integration
- adapter-specific compatibility tests

## Deferred Beyond This Boundary

- runtime API service
- multi-host network service
- advanced self-learning policy adaptation
- host-side invasive changes

## Split Rule

A repo split is allowed only when:

- portable contract paths remain stable
- standalone commands continue to work without adapter coupling
- adapters can consume exports without redefining product-core behavior
