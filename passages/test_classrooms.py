from django.contrib.auth.models import User
from django.test import TestCase

from passages.models import Profile


class ClassroomInviteFlowTest(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(username='smoke_teacher', password='pw12345!')
        Profile.objects.create(user=self.teacher, role=Profile.ROLE_TEACHER)

        self.student = User.objects.create_user(username='smoke_student', password='pw12345!')
        Profile.objects.create(user=self.student, role=Profile.ROLE_STUDENT)

    def test_create_join_roster_regenerate_remove(self):
        self.client.force_login(self.teacher)

        r = self.client.post('/api/classrooms/', {'name': 'Smoke Test Class'})
        self.assertEqual(r.status_code, 201, r.content)
        classroom_id = r.json()['id']
        code = r.json()['join_code']
        self.assertEqual(len(code), 6)

        self.client.logout()
        self.client.force_login(self.student)

        r = self.client.post('/api/classrooms/join/', {'code': code})
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(len(r.json()['students']), 1)

        # duplicate join rejected
        r = self.client.post('/api/classrooms/join/', {'code': code})
        self.assertEqual(r.status_code, 400)

        self.client.logout()
        self.client.force_login(self.teacher)

        r = self.client.get('/api/classrooms/')
        self.assertEqual(r.json()[0]['student_count'], 1)

        r = self.client.post(f'/api/classrooms/{classroom_id}/regenerate-code/')
        self.assertEqual(r.status_code, 200)
        new_code = r.json()['join_code']
        self.assertNotEqual(new_code, code)

        self.client.logout()
        self.client.force_login(self.student)

        # old code no longer works
        r = self.client.post('/api/classrooms/join/', {'code': code})
        self.assertEqual(r.status_code, 404)

        self.client.logout()
        self.client.force_login(self.teacher)

        r = self.client.post(f'/api/classrooms/{classroom_id}/remove-student/', {'student_id': self.student.id})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['student_count'], 0)

    def test_teacher_cannot_join_as_student(self):
        self.client.force_login(self.teacher)
        r = self.client.post('/api/classrooms/', {'name': 'Another Class'})
        code = r.json()['join_code']

        r = self.client.post('/api/classrooms/join/', {'code': code})
        self.assertEqual(r.status_code, 403)
