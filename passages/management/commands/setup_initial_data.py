from django.core.management.base import BaseCommand
from passages.models import GradeLevel, SkillCategory, Topic

class Command(BaseCommand):
    help = 'Set up initial grade levels, skill categories, and topics for Reading Knack'

    def handle(self, *args, **options):
        # Create grade levels
        grade_levels = [
            'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', 
            '4th Grade', '5th Grade', '6th Grade', '7th Grade', 
            '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'
        ]
        
        for grade in grade_levels:
            GradeLevel.objects.get_or_create(name=grade)
            self.stdout.write(f'Created grade level: {grade}')
        
        # Create skill categories
        skill_categories = [
            'Reading Comprehension', 'Vocabulary', 'Main Idea', 
            'Inference', 'Context Clues', 'Author\'s Purpose',
            'Text Structure', 'Compare and Contrast', 'Cause and Effect',
            'Sequence of Events', 'Character Analysis', 'Theme'
        ]
        
        for skill in skill_categories:
            SkillCategory.objects.get_or_create(name=skill)
            self.stdout.write(f'Created skill category: {skill}')
        
        # Create topics (subject matter of the passage)
        topics = [
            'History', 'Science', 'Nature', 'Geography',
            'Biography', 'Current Events', 'Literature', 'Social Studies'
        ]

        for topic in topics:
            Topic.objects.get_or_create(name=topic)
            self.stdout.write(f'Created topic: {topic}')

        self.stdout.write(
            self.style.SUCCESS('Successfully set up initial data!')
        ) 