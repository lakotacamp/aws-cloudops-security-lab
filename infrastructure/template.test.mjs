import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const { Resources: resources } = JSON.parse(readFileSync(new URL('./template.json', import.meta.url), 'utf8'))
test('route-specific stage settings wait for their API routes to exist', () => {
  for (const [stageId, stage] of Object.entries(resources)) {
    if (stage.Type !== 'AWS::ApiGatewayV2::Stage') continue
    for (const routeKey of Object.keys(stage.Properties.RouteSettings ?? {})) {
      const matchingRoute = Object.entries(resources).find(([, item]) =>
        item.Type === 'AWS::ApiGatewayV2::Route' && item.Properties.RouteKey === routeKey &&
        JSON.stringify(item.Properties.ApiId) === JSON.stringify(stage.Properties.ApiId))
      assert.ok(matchingRoute, `${stageId} configures a nonexistent route: ${routeKey}`)
      const dependencies = Array.isArray(stage.DependsOn) ? stage.DependsOn : [stage.DependsOn]
      assert.ok(dependencies.includes(matchingRoute[0]), `${stageId} must wait for ${matchingRoute[0]}`)
    }
  }
})
