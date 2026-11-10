from django.test import SimpleTestCase


class CorsHeadersTests(SimpleTestCase):
    def test_flutter_web_origin_is_allowed_for_login_preflight(self):
        response = self.client.options(
            '/api/v1/auth/login/',
            content_type='application/json',
            HTTP_ORIGIN='http://localhost:3001',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:3001')
