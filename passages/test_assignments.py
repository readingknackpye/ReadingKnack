from django.contrib.auth.models import User
from django.test import TestCase

from passages.models import Profile, UploadedDocument


class AssignmentFlowTest(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(username='assign_teacher', password='pw12345!')
        Profile.objects.create(user=self.teacher, role=Profile.ROLE_TEACHER)

        self.student = User.objects.create_user(username='assign_student', password='pw12345!')
        Profile.objects.create(user=self.student, role=Profile.ROLE_STUDENT)

        self.document = UploadedDocument.objects.create(title='Smoke Passage')

    def test_teacher_assigns_passage_and_student_sees_it(self):
        self.client.force_login(self.teacher)

        r = self.client.post('/api/classrooms/', {'name': 'Assignment Class'})
        self.assertEqual(r.status_code, 201, r.content)
        classroom_id = r.json()['id']
        join_code = r.json()['join_code']

        self.client.logout()
        self.client.force_login(self.student)
        r = self.client.post('/api/classrooms/join/', {'code': join_code})
        self.assertEqual(r.status_code, 200, r.content)

        self.client.logout()
        self.client.force_login(self.teacher)

        r = self.client.post(
            f'/api/classrooms/{classroom_id}/assignments/',
            {'document': self.document.id, 'instructions': 'Read carefully'},
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()['document_title'], 'Smoke Passage')

        r = self.client.get(f'/api/classrooms/{classroom_id}/assignments/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()), 1)

        self.client.logout()
        self.client.force_login(self.student)

        r = self.client.get('/api/my-assignments/')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(len(r.json()), 1)
        self.assertEqual(r.json()[0]['document_title'], 'Smoke Passage')
        self.assertEqual(r.json()[0]['classroom_name'], 'Assignment Class')

    def test_student_cannot_create_assignment(self):
        self.client.force_login(self.teacher)
        r = self.client.post('/api/classrooms/', {'name': 'Locked Class'})
        classroom_id = r.json()['id']

        self.client.logout()
        self.client.force_login(self.student)

        r = self.client.post(
            f'/api/classrooms/{classroom_id}/assignments/',
            {'document': self.document.id},
        )
        self.assertEqual(r.status_code, 403)
